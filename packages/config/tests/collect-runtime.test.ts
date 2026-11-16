import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { z } from 'zod';

import type { Logger } from '@deltabox/toolchain-shared';

import type { RewriteMessageContext } from '../src/index.js';
import {
    collect,
    ConfigParseError,
    loadConfig,
    loadConfigAsync,
    loadConfigSync,
    parseCliConfigAsync,
    parseCliConfigSync,
    parseConfig,
    parseEnvConfig,
    parseEnvConfigAsync,
    parseEnvConfigSync,
} from '../src/index.js';

const schema = z.object({
    base: z.object({
        host: z.string().default('localhost').meta({ envName: 'APP_HOST' }),
        port: z.number().default(8080).meta({ envName: 'APP_PORT', cliFlag: '--port' }),
    }),
});

const required = z.object({
    first: z.string().meta({ envName: 'APP_FIRST' }),
    second: z.string().meta({ envName: 'APP_SECOND' }),
});

const dirs: string[] = [];

function tempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-collect-'));
    dirs.push(dir);
    return dir;
}

afterEach(() => {
    while (dirs.length > 0) fs.rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe('collect runtime', () => {
    it('resolves env + CLI over schema defaults', () => {
        const config = collect(schema, {
            envSource: { APP_HOST: 'env-host' },
            argv: ['--port', '3000'],
        });
        expect(config).toEqual({ base: { host: 'env-host', port: 3000 } });
        expectTypeOf(config.base.host).toEqualTypeOf<string>();
    });

    it('defaults envSource to process.env', () => {
        process.env.APP_COLLECT_DEFAULT = 'from-process';
        try {
            const withDefault = z.object({
                value: z.string().default('fallback').meta({ envName: 'APP_COLLECT_DEFAULT' }),
            });
            expect(collect(withDefault)).toEqual({ value: 'from-process' });
        } finally {
            delete process.env.APP_COLLECT_DEFAULT;
        }
    });

    it('validates only when validate is true', () => {
        expect(collect(required, { envSource: {} })).toEqual({});
        expect(() => collect(required, { envSource: {}, validate: true })).toThrow(
            ConfigParseError
        );
    });

    it('warns/silences through errorOptions.errorLevel', () => {
        const warnings: string[] = [];
        const logger = {
            warn: (message: string) => warnings.push(message),
        } as unknown as Logger;
        expect(() =>
            collect(required, {
                envSource: {},
                validate: true,
                errorOptions: { errorLevel: 'warn', logger },
            })
        ).not.toThrow();
        expect(warnings).toHaveLength(1);
        expect(() =>
            collect(required, {
                envSource: {},
                validate: true,
                errorOptions: { errorLevel: 'silent', logger },
            })
        ).not.toThrow();
        expect(warnings).toHaveLength(1);
    });

    it('rewrites messages with pairs and callbacks', () => {
        const pairs = () =>
            collect(required, {
                envSource: {},
                validate: true,
                errorOptions: {
                    rewriteMessage: { find: /Invalid input.*/, replacement: 'pair-rewrite' },
                },
            });
        expect(pairs).toThrow(/pair-rewrite/);

        const contexts: string[] = [];
        expect(() =>
            collect(required, {
                envSource: {},
                validate: true,
                errorOptions: {
                    rewriteMessage: (context: RewriteMessageContext) => {
                        contexts.push(context.path);
                        return 'callback-rewrite';
                    },
                },
            })
        ).toThrow(/callback-rewrite/);
        expect(contexts.length).toBeGreaterThan(0);
    });

    it('uses per-kind default messages', () => {
        expect(() =>
            collect(required, {
                envSource: {},
                validate: true,
                errorOptions: { defaultMessage: { strings: 'String required' } },
            })
        ).toThrow(/String required/);
    });

    it('limits reported errors with trigger', () => {
        const parse = (trigger: 'initial' | 'last' | 'collect-all') => {
            try {
                collect(required, {
                    envSource: {},
                    validate: true,
                    errorOptions: { trigger },
                });
            } catch (error) {
                return (error as ConfigParseError).issues.length;
            }
            return 0;
        };
        expect(parse('initial')).toBe(1);
        expect(parse('last')).toBe(1);
        expect(parse('collect-all')).toBe(2);
    });

    it('filters values by presence kind', () => {
        const mixed = z.object({
            always: z.string().default('a').meta({ envName: 'APP_ALWAYS' }),
            maybe: z.string().optional().meta({ envName: 'APP_MAYBE' }),
        });
        expect(collect(mixed, { envSource: {}, include: { defined: true } })).toEqual({
            always: 'a',
        });
        expect(collect(mixed, { envSource: {}, exclude: { defined: true } })).toEqual({});
    });

    it('narrows literal include paths in the return type', () => {
        const config = collect(schema, { include: 'base.host' } as const);
        expectTypeOf(config).toEqualTypeOf<{ base: { host: string } }>();
        expect(config).toEqual({ base: { host: 'localhost' } });
    });
});

describe('parse wrappers', () => {
    it('exposes sync/async env and CLI variants', async () => {
        expect(parseEnvConfigSync(schema, { APP_HOST: 'sync' })).toEqual({
            base: { host: 'sync', port: 8080 },
        });
        await expect(parseEnvConfigAsync(schema, { APP_HOST: 'async' })).resolves.toEqual({
            base: { host: 'async', port: 8080 },
        });
        expect(parseCliConfigSync(schema, ['--port', '1'])).toEqual({
            base: { host: 'localhost', port: 1 },
        });
        await expect(parseCliConfigAsync(schema, ['--port', '2'])).resolves.toEqual({
            base: { host: 'localhost', port: 2 },
        });
    });

    it('merges overrides over the source result', () => {
        const config = parseConfig(
            schema,
            { base: { port: 9999 } },
            { envSource: { APP_HOST: 'env-host' } }
        );
        expect(config).toEqual({ base: { host: 'env-host', port: 9999 } });
    });

    it('validates a scoped schema unless a path filter removes the scope', () => {
        const scoped = {
            server: z.object({
                port: z.number().default(8080).meta({ envName: 'APP_SERVER_PORT' }),
            }),
            client: z.object({ port: z.number().meta({ envName: 'APP_CLIENT_PORT' }) }),
        };
        expect(() => parseEnvConfig(scoped, {})).toThrow(ConfigParseError);
        expect(parseEnvConfig(scoped, {}, { include: 'server.port' })).toEqual({
            server: { port: 8080 },
        });
    });

    it('accepts env/argv through the source dispatch', () => {
        expect(parseConfig(schema, { APP_HOST: 'env-input' }, { source: 'env' })).toEqual({
            base: { host: 'env-input', port: 8080 },
        });
        expect(parseConfig(schema, ['--port', '7'], { source: 'cli' })).toEqual({
            base: { host: 'localhost', port: 7 },
        });
    });
});

describe('loadConfig options', () => {
    it('loads through configFileOptions and a parser', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'custom.json'), '{"port":3000}');
        const loaded = await loadConfig({
            parser: z.object({ port: z.number() }),
            configFileOptions: { filename: 'custom', commonLocation: { cwd, path: '.' } },
        });
        expect(loaded?.config).toEqual({ port: 3000 });
        expect(loaded?.source).toBe('file');
    });

    it('honours allowed extensions and its required flag', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'custom.txt'), '{"port":1}');
        await expect(
            loadConfig({
                parser: z.object({ port: z.number() }),
                configFileOptions: {
                    filename: 'custom',
                    allowedFileExtensions: ['.json'],
                    commonLocation: { cwd, path: '.' },
                },
            })
        ).resolves.toBeUndefined();
        await expect(
            loadConfig({
                parser: z.object({ port: z.number() }),
                cwd,
                configFileOptions: { filename: 'custom', required: true },
            })
        ).rejects.toThrow(/No config file found/);
    });

    it('reads package.json keys through configFileOptions', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'package.json'), '{"customConfig":{"port":2}}');
        const loaded = await loadConfig({
            parser: z.object({ port: z.number() }),
            cwd,
            configFileOptions: {
                filename: 'custom',
                commonLocation: { path: '.' },
                packageJson: { key: 'customConfig' },
            },
        });
        expect(loaded?.source).toBe('package.json');
        expect(loaded?.key).toBe('customConfig');
    });

    it('supports per-extension loaders and globbed locations', async () => {
        const cwd = tempDir();
        fs.mkdirSync(path.join(cwd, 'nested'), { recursive: true });
        fs.writeFileSync(path.join(cwd, 'nested', 'custom.yaml'), 'ignored');
        const loaded = await loadConfig({
            parser: z.object({ port: z.number() }),
            configFileOptions: { filename: 'custom', commonLocation: { cwd, path: '**' } },
            loader: { yaml: () => ({ port: 3 }) },
        });
        expect(loaded?.config).toEqual({ port: 3 });
    });

    it('accepts promise and callback input', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'custom.json'), '{"port":4}');
        await expect(
            loadConfig(async () => ({
                parser: z.object({ port: z.number() }),
                cwd,
                configFileOptions: { filename: 'custom' },
            }))
        ).resolves.toMatchObject({ config: { port: 4 } });
        await expect(
            loadConfig(
                Promise.resolve({
                    parser: z.object({ port: z.number() }),
                    cwd,
                    configFileOptions: { filename: 'custom' },
                })
            )
        ).resolves.toMatchObject({ config: { port: 4 } });
    });

    it('loads synchronously with a parser', () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'custom.json'), '{"port":5}');
        const loaded = loadConfigSync({
            parser: z.object({ port: z.number() }),
            cwd,
            configFileOptions: { filename: 'custom' },
        });
        expect(loaded?.config).toEqual({ port: 5 });
    });

    it('uses a custom loader for YAML/TS and keeps async/sync variants', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'custom.yaml'), 'ignored');
        await expect(
            loadConfigAsync({
                cwd,
                schema: z.object({ port: z.number() }),
                names: ['custom.yaml'],
                loader: () => ({ port: 6 }),
            })
        ).resolves.toMatchObject({ config: { port: 6 } });
    });
});

describe('collect type helpers', () => {
    it('merges override types and keeps the schema shape', () => {
        const config = parseEnvConfig(schema, {}, {});
        expectTypeOf(config.base.port).toEqualTypeOf<number>();
    });
});
