import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import {
    collect,
    ConfigParseError,
    createConfigFile,
    loadConfig,
    loadConfigAsync,
    loadConfigSync,
    parseCliConfig,
    parseConfig,
    parseEnvConfig,
} from '../src/index.js';

const schema = z.object({
    host: z.string(),
    port: z.number(),
    debug: z.boolean(),
    tags: z.array(z.string()),
});

const envSchema = z.object({
    base: z.object({
        host: z.string().default('localhost').meta({ envName: 'APP_HOST' }),
        port: z.number().default(8080).meta({ envName: 'APP_PORT' }),
        debug: z.boolean().default(false).meta({ envName: 'APP_DEBUG' }),
        tags: z.array(z.string()).default([]).meta({ envName: 'APP_TAGS' }),
    }),
});

const cliSchema = z.object({
    base: z.object({
        host: z.string().meta({ envName: 'APP_HOST', cliFlag: '--host' }),
        port: z.number().meta({ envName: 'APP_PORT', cliFlag: '--port' }),
        debug: z.boolean().meta({ envName: 'APP_DEBUG', cliFlag: '--debug' }),
        tags: z.array(z.string()).meta({ envName: 'APP_TAGS', cliFlag: '--tag' }),
    }),
});

const tempDirs: string[] = [];

function tempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-parser-'));
    tempDirs.push(dir);
    return dir;
}

afterEach(() => {
    while (tempDirs.length > 0) {
        fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
});

describe('collect options', () => {
    it('limits the walk with maxDepth', () => {
        const defs = collect(envSchema, { envPrefix: 'APP_', maxDepth: 2 });
        expect(defs.map(def => def.name)).toEqual([
            'APP_HOST',
            'APP_PORT',
            'APP_DEBUG',
            'APP_TAGS',
        ]);
        expect(collect(envSchema, { envPrefix: 'APP_', maxDepth: 1 }).map(def => def.name)).toEqual(
            []
        );
    });

    it('filters by glob and predicate', () => {
        const glob = collect(envSchema, { envPrefix: 'APP_', include: 'base.host' });
        expect(glob.map(def => def.name)).toEqual(['APP_HOST']);
        const predicate = collect(envSchema, {
            envPrefix: 'APP_',
            exclude: def => def.path.endsWith('tags'),
        });
        expect(predicate.map(def => def.path)).not.toContain('base.tags');
    });

    it('reports missing required values through errorOptions', () => {
        const requiredSchema = z.object({
            token: z.string().meta({ envName: 'APP_TOKEN', required: true }),
        });
        expect(() =>
            collect(requiredSchema, {
                envPrefix: 'APP_',
                envSource: {},
                validate: true,
                errorOptions: { level: 'throw', triggers: ['missing-required'] },
            })
        ).toThrow(/Missing required config/);
    });
});

describe('parseEnvConfig', () => {
    it('coerces booleans, numbers and lists', () => {
        const config = parseEnvConfig(envSchema, {
            APP_HOST: '0.0.0.0',
            APP_PORT: '3000',
            APP_DEBUG: 'yes',
            APP_TAGS: 'a, b',
        });
        expect(config).toEqual({
            base: { host: '0.0.0.0', port: 3000, debug: true, tags: ['a', 'b'] },
        });
    });

    it('keeps schema defaults for unset vars and validates', () => {
        expect(parseEnvConfig(envSchema, {}).base.port).toBe(8080);
        expect(() => parseEnvConfig(schema, {})).toThrow(ConfigParseError);
    });
});

describe('parseCliConfig', () => {
    it('reads short/long flags, = values and repeated arrays', () => {
        const config = parseCliConfig(cliSchema, [
            '--host',
            'example.com',
            '--port=4000',
            '--debug',
            '--tag',
            'a',
            '--tag',
            'b',
        ]);
        expect(config).toEqual({
            base: { host: 'example.com', port: 4000, debug: true, tags: ['a', 'b'] },
        });
    });

    it('dispatches through parseConfig with source: cli', () => {
        const config = parseConfig(
            cliSchema,
            ['--host', 'x', '--port', '1', '--debug', '--tag', 'a'],
            {
                source: 'cli',
            }
        );
        expect(config.base.host).toBe('x');
        expect(config.base.port).toBe(1);
    });
});

describe('parseConfig', () => {
    it('validates file objects', () => {
        const config = parseConfig(schema, {
            host: 'h',
            port: 1,
            debug: false,
            tags: [],
        });
        expect(config.host).toBe('h');
    });

    it('throws a ConfigParseError with issues on invalid input', () => {
        try {
            parseConfig(schema, {});
            throw new Error('expected a failure');
        } catch (error) {
            expect(error).toBeInstanceOf(ConfigParseError);
            expect((error as ConfigParseError).issues.length).toBeGreaterThan(0);
        }
    });
});

describe('loadConfig', () => {
    it('loads a JSON config from a common location', async () => {
        const cwd = tempDir();
        fs.mkdirSync(path.join(cwd, 'config'), { recursive: true });
        fs.writeFileSync(path.join(cwd, 'config', 'dbx.config.json'), '{"a":1}');
        const loaded = await loadConfig<{ a: number }>({ cwd });
        expect(loaded?.config.a).toBe(1);
        expect(loaded?.source).toBe('file');
    });

    it('reads a package.json key', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'package.json'), '{"toolchain":{"a":2}}');
        const loaded = await loadConfig<{ a: number }>({
            cwd,
            names: [],
            packageJsonKeys: ['toolchain'],
        });
        expect(loaded?.config.a).toBe(2);
        expect(loaded?.source).toBe('package.json');
        expect(loaded?.key).toBe('toolchain');
    });

    it('returns undefined unless required', async () => {
        const cwd = tempDir();
        await expect(loadConfig({ cwd })).resolves.toBeUndefined();
        await expect(
            loadConfigAsync({ cwd, names: ['missing.config.json'], required: true })
        ).rejects.toThrow(/No config file found/);
    });

    it('validates through a schema', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.json'), '{"a":"wrong"}');
        await expect(loadConfig({ cwd, schema: z.object({ a: z.number() }) })).rejects.toThrow();
    });

    it('rejects a synchronous TypeScript load', () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.ts'), 'export default {};');
        expect(() => loadConfigSync({ cwd })).toThrow(/TypeScript config synchronously/);
    });

    it('uses a custom loader', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.anything'), 'ignored');
        const loaded = await loadConfig<{ a: number }>({
            cwd,
            names: ['dbx.config.anything'],
            loader: () => ({ a: 3 }),
        });
        expect(loaded?.config.a).toBe(3);
    });
});

describe('createConfigFile', () => {
    it('writes a starter config and refuses to overwrite', () => {
        const cwd = tempDir();
        const file = createConfigFile({ cwd });
        const source = fs.readFileSync(file, 'utf-8');
        expect(source).toContain('defineConfig');
        expect(source).toContain('{ toolchain: {} }');
        expect(() => createConfigFile({ cwd })).toThrow(/already exists/);
        expect(() => createConfigFile({ cwd, overwrite: true })).not.toThrow();
    });

    it('accepts custom imports and content', () => {
        const cwd = tempDir();
        const file = createConfigFile({
            cwd,
            name: 'custom.config.ts',
            imports: ["import { z } from 'zod';"],
            content: '{ toolchain: { enabled: true } }',
        });
        const source = fs.readFileSync(file, 'utf-8');
        expect(source).toContain("from 'zod'");
        expect(source).toContain('enabled: true');
    });
});
