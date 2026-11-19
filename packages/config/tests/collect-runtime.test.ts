import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { z } from 'zod';

import type { Logger } from '@deltabox/toolchain/shared';

import type { RewriteMessageContext } from '../src/index.js';
import {
    collect,
    collectDefinitions,
    ConfigParseError,
    generateEnv,
    generateEnvFile,
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

describe('env name and array coercion', () => {
    it('reads the env names generated from camelCase and underscore paths', () => {
        const generated = z.object({
            logLevel: z.string().default('info'),
            nestedThing: z.object({ someValue: z.number().default(1) }),
            pdf_options: z.object({ paper: z.string().default('a4') }),
        });

        expect(
            parseEnvConfig(generated, {
                APP_LOGLEVEL: 'debug',
                APP_NESTEDTHING_SOMEVALUE: '5',
                APP_PDF_OPTIONS_PAPER: 'letter',
            })
        ).toEqual({
            logLevel: 'debug',
            nestedThing: { someValue: 5 },
            pdf_options: { paper: 'letter' },
        });
    });

    it('coerces array elements to the declared item type', () => {
        const arrays = z.object({
            ports: z.array(z.number()).default([]),
            flags: z.array(z.boolean()).default([]),
        });

        expect(parseEnvConfig(arrays, { APP_PORTS: '1,2', APP_FLAGS: 'true,no' })).toEqual({
            ports: [1, 2],
            flags: [true, false],
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

describe('bug regressions (hunt #8)', () => {
    it('applies parent object defaults to children', () => {
        const schema = z.object({
            a: z.object({ b: z.string(), c: z.number().default(2) }).default({ b: 'y', c: 2 }),
            plain: z.object({ d: z.string().default('z') }),
        });
        expect(collectDefinitions(schema).find(def => def.path === 'a.b')?.default).toBe('y');
        expect(collect(schema, { envPrefix: null, envSource: {}, argv: [] })).toEqual({
            a: { b: 'y', c: 2 },
            plain: { d: 'z' },
        });
        expect(parseEnvConfig(schema, {})).toEqual({
            a: { b: 'y', c: 2 },
            plain: { d: 'z' },
        });
    });

    it('generates env vars for path-derived names', () => {
        const schema = z.object({
            host: z.string().default('localhost'),
            port: z.number().default(3000),
            flags: z.array(z.string()).default([]),
            rec: z.record(z.string(), z.string()),
        });
        const content = generateEnvFile(schema);
        expect(content).toContain('APP_HOST=localhost');
        expect(content).toContain('APP_PORT=3000');
        expect(content).toContain('APP_FLAGS=');
        expect(content).not.toContain('APP_REC=');
        expect(
            generateEnvFile(schema, { values: { APP_HOST: 'x' }, include: ['APP_HOST'] })
        ).toContain('APP_HOST=x');

        // The generated typings agree with the env file: path-derived names are
        // included, complex leaves without a name are not.
        const types = generateEnv(schema);
        expect(types).toContain('APP_HOST?: string;');
        expect(types).toContain('APP_FLAGS?: string;');
        expect(types).not.toContain('APP_REC');
    });

    it('quotes generated env values so they round-trip', () => {
        const schema = z.object({
            url: z.string().default('https://example.com/path#fragment'),
            multi: z.string().default('line1\nline2'),
            spaced: z.string().default('  hello  '),
        });
        const content = generateEnvFile(schema, { envPrefix: 'APP_' });

        expect(content).toContain("APP_URL='https://example.com/path#fragment'");
        expect(content).toContain("APP_MULTI='line1\nline2'");
        expect(content).toContain("APP_SPACED='  hello  '");
    });

    it('keeps distinctive schema kinds', () => {
        const kinds = Object.fromEntries(
            collectDefinitions(
                z.object({
                    map: z.map(z.string(), z.number()),
                    set: z.set(z.string()),
                    union: z.union([z.string(), z.number()]),
                    record: z.record(z.string(), z.string()),
                    literal: z.literal('x'),
                    enum: z.enum(['a', 'b']),
                    any: z.any(),
                })
            ).map(def => [def.path, def.kind])
        );
        expect(kinds.map).not.toBe('string');
        expect(kinds.set).not.toBe('string');
        expect(kinds.union).toBe('union');
        expect(kinds.record).toBe('record');
        expect(kinds.literal).toBe('literal');
        expect(kinds.enum).toBe('enum');
        expect(kinds.any).toBe('unknown');
    });

    it('supports ? [] {} in include/exclude globs', () => {
        const schema = z.object({
            base: z.object({ host: z.string(), port: z.number() }),
            other: z.string(),
        });
        const paths = (pattern: string): string[] =>
            collectDefinitions(schema, { include: pattern }).map(def => def.path);
        expect(paths('base.h?st')).toEqual(['base.host']);
        expect(paths('base.[hp]ost')).toEqual(['base.host']);
        expect(paths('{base.host,other}')).toEqual(['base.host', 'other']);
    });
});
