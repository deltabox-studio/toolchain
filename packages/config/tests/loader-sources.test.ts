import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { z } from 'zod';

import {
    type ConfigParseError,
    loadCliConfig,
    loadCliConfigSync,
    loadConfig,
    loadConfigAsync,
    loadConfigSync,
    loadEnvConfig,
    loadEnvConfigAsync,
    loadEnvConfigSync,
    loadFileConfig,
    loadFileConfigSync,
    parseConfig,
} from '../src/index.js';

const parser = z.object({
    host: z.string().default('localhost').meta({ envName: 'MYAPP_HOST', cliFlag: '--host' }),
    port: z.number().default(3000).meta({ envName: 'MYAPP_PORT', cliFlag: '--port' }),
    debug: z.boolean().default(false).meta({ envName: 'MYAPP_DEBUG', cliFlag: '--debug' }),
});

const tempDirs: string[] = [];

function tempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-loader-sources-'));
    tempDirs.push(dir);
    return dir;
}

function writeConfig(cwd: string, value: unknown, name = 'config.json'): string {
    const file = path.join(cwd, name);
    fs.writeFileSync(file, JSON.stringify(value));
    return file;
}

afterEach(() => {
    while (tempDirs.length > 0) fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe('loader sources', () => {
    it('applies file, env, CLI and overrides in that order by default', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { host: 'file', port: 1, debug: false });
        const loaded = await loadConfigAsync({
            cwd,
            parser,
            envPrefix: 'MYAPP_',
            envSource: { MYAPP_PORT: '2' },
            argv: ['--debug'],
            overrides: { host: 'override' },
        });
        expect(loaded?.config).toEqual({ host: 'override', port: 2, debug: true });
    });

    it('keeps the file value below env and CLI', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { host: 'file', port: 1, debug: false });
        const loaded = await loadConfig({
            cwd,
            parser,
            envPrefix: 'MYAPP_',
            envSource: { MYAPP_HOST: 'env' },
            argv: ['--port', '9'],
        });
        expect(loaded?.config).toEqual({ host: 'env', port: 9, debug: false });
    });

    it('loadFileConfig ignores env and CLI', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { host: 'file', port: 1, debug: false });
        const loaded = await loadFileConfig({
            cwd,
            parser,
            envPrefix: 'MYAPP_',
            envSource: { MYAPP_PORT: '2' },
            argv: ['--debug'],
        });
        expect(loaded?.config).toEqual({ host: 'file', port: 1, debug: false });
        expect(loadFileConfigSync({ cwd, parser })?.config).toEqual({
            host: 'file',
            port: 1,
            debug: false,
        });
    });

    it('loadEnvConfig reads env but not CLI', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { host: 'file', port: 1, debug: false });
        const options = {
            cwd,
            parser,
            envPrefix: 'MYAPP_',
            envSource: { MYAPP_PORT: '2' },
            argv: ['--debug'],
        };
        await expect(loadEnvConfig(options)).resolves.toMatchObject({
            config: { host: 'file', port: 2, debug: false },
        });
        expect(loadEnvConfigSync(options)?.config).toEqual({ host: 'file', port: 2, debug: false });
    });

    it('loadCliConfig reads CLI but not env', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { host: 'file', port: 1, debug: false });
        const options = {
            cwd,
            parser,
            envPrefix: 'MYAPP_',
            envSource: { MYAPP_PORT: '2' },
            argv: ['--debug'],
        };
        await expect(loadCliConfig(options)).resolves.toMatchObject({
            config: { host: 'file', port: 1, debug: true },
        });
        expect(loadCliConfigSync(options)?.config).toEqual({
            host: 'file',
            port: 1,
            debug: true,
        });
    });

    it('accepts an explicit source union', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { host: 'file', port: 1, debug: false });
        const loaded = await loadConfigSync({
            cwd,
            parser,
            source: ['env', 'cli'],
            envPrefix: 'MYAPP_',
            envSource: { MYAPP_PORT: '4' },
            argv: ['--debug'],
        });
        expect(loaded?.config).toEqual({ host: 'file', port: 4, debug: true });
    });

    it('accepts a source union in parseConfig', () => {
        const config = parseConfig(
            parser,
            {},
            {
                source: ['env', 'cli'],
                envPrefix: 'MYAPP_',
                envSource: { MYAPP_PORT: '5' },
                argv: ['--debug'],
            }
        );
        expect(config).toEqual({ host: 'localhost', port: 5, debug: true });
        expect(parseConfig(parser, { port: 7 }, { source: ['file'], envPrefix: 'MYAPP_' })).toEqual(
            { host: 'localhost', port: 7, debug: false }
        );
    });

    it('uses neutral default file names', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { from: 'dbx' }, 'dbx.config.json');
        await expect(loadConfig({ cwd })).resolves.toBeUndefined();

        writeConfig(cwd, { from: 'neutral' });
        await expect(loadConfig({ cwd })).resolves.toMatchObject({
            config: { from: 'neutral' },
        });
    });

    it('returns undefined or throws for a missing file', async () => {
        const cwd = tempDir();
        await expect(loadEnvConfig({ cwd, parser })).resolves.toBeUndefined();
        await expect(
            loadEnvConfig({ cwd, parser, names: ['missing.json'], required: true })
        ).rejects.toThrow(/No config file found/);
    });

    it('validates the merged result', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { port: 'not-a-number' });
        await expect(loadFileConfig({ cwd, parser, names: ['config.json'] })).rejects.toMatchObject(
            { issues: expect.any(Array) }
        );
        try {
            await loadFileConfig({ cwd, parser, names: ['config.json'] });
        } catch (error) {
            expect((error as ConfigParseError).issues.length).toBeGreaterThan(0);
        }
    });

    it('validates primitive and array file values directly', async () => {
        const cwd = tempDir();
        writeConfig(cwd, 'hello');
        await expect(
            loadFileConfig({ cwd, names: ['config.json'], parser: z.string() })
        ).resolves.toMatchObject({ config: 'hello' });
        writeConfig(cwd, ['a', 'b']);
        await expect(
            loadFileConfig({ cwd, names: ['config.json'], parser: z.array(z.string()) })
        ).resolves.toMatchObject({ config: ['a', 'b'] });
    });

    it('merges overrides into a raw load without a parser', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { host: 'file', nested: { port: 1 } });
        await expect(
            loadConfig({ cwd, overrides: { host: 'raw', nested: { port: 2 } } })
        ).resolves.toMatchObject({ config: { host: 'raw', nested: { port: 2 } } });
    });

    it('applies sources to schema-based loaders too', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { host: 'file', port: 1, debug: false });
        const loaded = await loadEnvConfig({
            cwd,
            schema: parser,
            envPrefix: 'MYAPP_',
            envSource: { MYAPP_PORT: '6' },
            argv: ['--debug'],
        });
        expect(loaded?.config).toEqual({ host: 'file', port: 6, debug: false });
    });

    it('infers the parsed config type from an inline parser', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { test: 'ok' });
        const loaded = await loadConfigAsync({
            cwd,
            names: ['config.json'],
            parser: z.object({ test: z.string() }),
        });
        expectTypeOf(loaded?.config).toEqualTypeOf<{ test: string } | undefined>();
        expect(loaded?.config.test).toBe('ok');
    });

    it('infers plain-object and untyped parser types', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { server: { port: 4000 } });
        const plain = await loadConfigAsync({
            cwd,
            names: ['config.json'],
            parser: { server: { port: 3000 } },
        });
        if (plain) {
            const typed: { server: { port: number } } = plain.config;
            const shaped: typeof plain.config = { server: { port: 4000 } };
            expect(typed).toEqual(shaped);
            expect(plain.config).toEqual({ server: { port: 4000 } });
        }

        const untyped = await loadConfigAsync({
            cwd,
            names: ['config.json'],
            parser: { type: 'object', properties: { port: { type: 'number' } } },
        });
        if (untyped) {
            const record: { [x: string]: unknown } = untyped.config;
            const shaped: typeof untyped.config = { server: { port: 4000 } };
            expect(record).toEqual(shaped);
            expect(untyped.config).toEqual({ server: { port: 4000 } });
        }
    });

    it('infers schema-based and sync loader types', async () => {
        const cwd = tempDir();
        writeConfig(cwd, { test: 'ok' });
        const loaded = loadFileConfigSync({
            cwd,
            names: ['config.json'],
            schema: z.object({ test: z.string() }),
        });
        expectTypeOf(loaded?.config).toEqualTypeOf<{ test: string } | undefined>();
        expect(loaded?.config).toEqual({ test: 'ok' });

        const asyncLoaded = await loadEnvConfigAsync({
            cwd,
            names: ['config.json'],
            schema: z.object({ test: z.string() }),
        });
        expectTypeOf(asyncLoaded?.config).toEqualTypeOf<{ test: string } | undefined>();
        expect(asyncLoaded?.config).toEqual({ test: 'ok' });
    });
});
