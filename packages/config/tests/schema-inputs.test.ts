import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import {
    collectDefinitions,
    createConfigEngine,
    flattenBaseSchema,
    generateConfigJsonSchema,
    generateConfigMarkdown,
    generateConfigTypes,
    loadConfig,
    loadConfigAsync,
    loadConfigSync,
    normalizeBaseGroups,
    parseConfig,
    parseEnvConfig,
    splitBaseSchema,
    toSchemaType,
} from '../src/index.js';
import type { ConfigSchema, ConfigSchemaType } from '../src/types/index.js';

const tempDirs: string[] = [];

function tempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-schema-inputs-'));
    tempDirs.push(dir);
    return dir;
}

afterEach(() => {
    while (tempDirs.length > 0) {
        fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
});

const baseSchema = {
    config: {
        type: 'object',
        properties: {
            base: {
                type: 'object',
                properties: {
                    port: { type: 'number', default: 3000, envName: 'APP_PORT' },
                },
            },
            server: {
                type: 'object',
                properties: {
                    host: { type: 'string', default: 'localhost', envName: 'APP_HOST' },
                },
            },
            auth: {
                type: 'object',
                properties: {
                    token: { type: 'string', default: 'secret' },
                },
            },
        },
    },
} as const;

describe('plain and untyped schema inputs', () => {
    it('collects and parses plain object leaves', () => {
        const plain = {
            server: {
                port: 3000,
                host: 'localhost',
                tags: ['a', 'b'],
            },
        };
        const defs = collectDefinitions(plain as ConfigSchema);
        expect(defs.map(def => def.path)).toEqual(['port', 'host', 'tags']);
        expect(parseEnvConfig(plain as never, { APP_PORT: '4000' })).toEqual({
            server: { port: 4000, host: 'localhost', tags: ['a', 'b'] },
        });
    });

    it('parses untyped schemas without Zod', () => {
        const untyped: ConfigSchema = {
            type: 'object',
            properties: {
                port: { type: 'number', default: 3000, envName: 'APP_PORT' },
                host: { type: 'string', default: 'localhost' },
            },
        };
        expect(parseEnvConfig(untyped, { APP_PORT: '4000' })).toEqual({
            port: 4000,
            host: 'localhost',
        });
    });

    it('parses primitive scopes as a single config leaf', () => {
        expect(parseEnvConfig({ version: '1.0.0' } as never, { APP_CONFIG: '2.0.0' })).toEqual({
            version: { config: '2.0.0' },
        });
    });

    it('merges arrays of schema parts', () => {
        const parts = [
            z.object({ host: z.string().default('localhost') }),
            z.object({ port: z.number().default(3000) }),
        ];
        expect(parseEnvConfig(parts, { APP_PORT: '4000' })).toEqual({
            host: 'localhost',
            port: 4000,
        });
    });

    it('accepts plain values in parseConfig overrides', () => {
        const scoped: ConfigSchema = { config: { port: 3000 } };
        expect(parseConfig(scoped, { config: { port: 4000 } })).toEqual({
            config: { port: 4000 },
        });
    });
});

describe('baseGroup arrays', () => {
    it('normalizes a string, an array and nested arrays', () => {
        expect(normalizeBaseGroups(undefined)).toEqual(['base']);
        expect(normalizeBaseGroups('base')).toEqual(['base']);
        expect(normalizeBaseGroups(['base', 'server'])).toEqual(['base', 'server']);
        expect(normalizeBaseGroups(['base', ['server', 'auth']])).toEqual([
            'base',
            'server',
            'auth',
        ]);
        expect(normalizeBaseGroups(['', 'base', 'base'])).toEqual(['base']);
    });

    it('merges every base group in split and flatten', () => {
        const schema = toSchemaType(baseSchema.config) as ConfigSchemaType;
        const split = splitBaseSchema(schema, ['base', 'server']);
        expect(Object.keys(split.base.properties ?? {})).toEqual(['port', 'host']);
        expect(Object.keys(split.groups.properties ?? {})).toEqual(['auth']);

        const flattened = flattenBaseSchema(schema, ['base', 'server']);
        expect(Object.keys(flattened.properties ?? {})).toEqual(['port', 'host', 'auth']);
    });

    it('applies every base group to types, markdown and JSON Schema', async () => {
        const types = generateConfigTypes(baseSchema as ConfigSchema, {
            baseGroup: ['base', 'server'],
        });
        expect(types.config).toContain('port?: number');
        expect(types.config).toContain('host?: string');

        const markdown = generateConfigMarkdown(baseSchema as ConfigSchema, {
            baseGroup: ['base', 'server'],
        })['config.md'];
        expect(markdown).toContain('### `port`');
        expect(markdown).toContain('### `host`');

        const json = await generateConfigJsonSchema(baseSchema as ConfigSchema, {
            baseGroup: ['base', 'server'],
        });
        const config = (json.properties as Record<string, { properties?: Record<string, unknown> }>)
            .config;
        expect(Object.keys(config?.properties ?? {})).toEqual(['port', 'host', 'auth']);
    });

    it('keeps the array on the engine and uses it for generation', () => {
        const engine = createConfigEngine({
            schema: baseSchema as ConfigSchema,
            baseGroup: ['base', 'server'],
        });
        expect(engine.baseGroup).toEqual(['base', 'server']);
        expect(engine.types.generate().config).toContain('port?: number');
        expect(engine.types.generate().config).toContain('host?: string');
    });
});

describe('loadConfig parser typing and parsing', () => {
    const parser = z.object({
        test: z.string(),
        port: z.number().default(3000),
    });

    it('accepts the parser plus flat discovery options', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.json'), '{"test":"ok","port":4000}');

        const loaded = await loadConfigAsync({
            parser,
            cwd,
            names: ['dbx.config.json'],
            locations: ['.'],
            accept: () => true,
            fresh: true,
            tsconfig: false,
        });

        expect(loaded?.config).toEqual({ test: 'ok', port: 4000 });
    });

    it('parses the file value through the parser without a separate parse call', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.json'), '{"test":"ok"}');

        const loaded = await loadConfig({
            parser,
            cwd,
            names: ['dbx.config.json'],
            validate: true,
        });

        expect(loaded?.config).toEqual({ test: 'ok', port: 3000 });
    });

    it('merges overrides and can skip validation', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.json'), '{"test":"ok","port":4000}');

        const overridden = await loadConfig({
            parser,
            cwd,
            names: ['dbx.config.json'],
            overrides: { port: 5000 },
        });
        expect(overridden?.config).toEqual({ test: 'ok', port: 5000 });

        const loose = await loadConfig({
            parser: z.object({ missing: z.string() }),
            cwd,
            names: ['dbx.config.json'],
            validate: false,
        });
        expect(loose?.config).toEqual({ test: 'ok', port: 4000 });
    });

    it('supports the synchronous loader with a parser', () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.json'), '{"test":"sync","port":1}');
        const loaded = loadConfigSync({
            parser,
            cwd,
            names: ['dbx.config.json'],
        });
        expect(loaded?.config).toEqual({ test: 'sync', port: 1 });
    });

    it('supports the configFileOptions discovery shape with a parser', async () => {
        const cwd = tempDir();
        fs.mkdirSync(path.join(cwd, 'config'));
        fs.writeFileSync(path.join(cwd, 'config', 'custom.config.json'), '{"test":"custom"}');

        const loaded = await loadConfigAsync({
            parser,
            cwd,
            configFileOptions: {
                filename: 'custom.config',
                commonLocation: [{ path: 'config' }],
            },
        });

        expect(loaded?.config).toEqual({ test: 'custom', port: 3000 });
    });

    it('validates the schema option too', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.json'), '{"test":1}');
        await expect(
            loadConfig({ cwd, names: ['dbx.config.json'], schema: parser })
        ).rejects.toThrow();
    });
});
