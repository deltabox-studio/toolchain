import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { configCommands } from '../src/cli/index.js';
import {
    collect,
    collectDefinitions,
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
        const defs = collectDefinitions(envSchema, { envPrefix: 'APP_', maxDepth: 2 });
        expect(defs.map(def => def.name)).toEqual([
            'APP_HOST',
            'APP_PORT',
            'APP_DEBUG',
            'APP_TAGS',
        ]);
        expect(
            collectDefinitions(envSchema, { envPrefix: 'APP_', maxDepth: 1 }).map(def => def.name)
        ).toEqual([]);
    });

    it('filters by glob and predicate', () => {
        const glob = collectDefinitions(envSchema, { envPrefix: 'APP_', include: 'base.host' });
        expect(glob.map(def => def.name)).toEqual(['APP_HOST']);
        const predicate = collectDefinitions(envSchema, {
            envPrefix: 'APP_',
            exclude: def => def.path.endsWith('tags'),
        });
        expect(predicate.map(def => def.path)).not.toContain('base.tags');
    });

    it('reads the env var name when it differs from the dotted path', () => {
        const named = z.object({
            base: z.object({
                token: z.string().meta({ envName: 'APP_TOKEN', required: true }),
            }),
        });
        expect(collectDefinitions(named).map(def => def.name)).toEqual(['APP_TOKEN']);
        expect(
            collectDefinitions(named, {
                envPrefix: null,
            }).map(def => def.name)
        ).toEqual(['APP_TOKEN']);
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
                errorOptions: { errorLevel: 'throw' },
            })
        ).toThrow(ConfigParseError);
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

    it('keeps multiple scopes separate', () => {
        const scoped = {
            server: z.object({
                port: z.number().meta({ envName: 'APP_SERVER_PORT', cliFlag: '--server-port' }),
            }),
            client: z.object({
                port: z.number().meta({ envName: 'APP_CLIENT_PORT', cliFlag: '--client-port' }),
            }),
        };
        expect(parseEnvConfig(scoped, { APP_SERVER_PORT: '1', APP_CLIENT_PORT: '2' })).toEqual({
            server: { port: 1 },
            client: { port: 2 },
        });
        expect(parseCliConfig(scoped, ['--server-port', '1', '--client-port', '2'])).toEqual({
            server: { port: 1 },
            client: { port: 2 },
        });
    });

    it('validates against the env argument, not options.envSource', () => {
        const named = z.object({
            base: z.object({
                token: z.string().meta({ envName: 'APP_TOKEN', required: true }),
            }),
        });
        expect(
            parseEnvConfig(
                named,
                { APP_TOKEN: 'x' },
                {
                    validate: true,
                    errorOptions: { errorLevel: 'throw' },
                }
            )
        ).toEqual({ base: { token: 'x' } });
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

    it('keeps = inside inline values', () => {
        const values = z.object({
            token: z.string().meta({ envName: 'APP_TOKEN', cliFlag: '--token' }),
            url: z.string().meta({ envName: 'APP_URL', cliFlag: '--url' }),
        });
        expect(parseCliConfig(values, ['--token=abc==', '--url=https://x.test/?a=b'])).toEqual({
            token: 'abc==',
            url: 'https://x.test/?a=b',
        });
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

describe('bug regressions', () => {
    it('keeps positionals after boolean flags and accepts negative numbers', () => {
        const bool = z.object({
            verbose: z.boolean().meta({ envName: 'APP_VERBOSE', cliFlag: '--verbose' }),
        });
        expect(parseCliConfig(bool, ['--verbose', 'file.txt'])).toEqual({ verbose: true });
        const num = z.object({
            port: z.number().meta({ envName: 'APP_PORT', cliFlag: '--port' }),
        });
        expect(parseCliConfig(num, ['--port', '-1'])).toEqual({ port: -1 });
    });

    it('forwards argv/envSource from parseConfig options', () => {
        const host = z.object({
            host: z.string().meta({ envName: 'APP_HOST', cliFlag: '--host' }),
        });
        expect(parseConfig(host, undefined, { source: 'cli', argv: ['--host', 'option'] })).toEqual(
            { host: 'option' }
        );
        expect(
            parseConfig(host, undefined, { source: 'env', envSource: { APP_HOST: 'option' } })
        ).toEqual({ host: 'option' });
    });

    it('treats blank env values as unset', () => {
        const defaults = z.object({
            port: z.number().default(8080).meta({ envName: 'APP_PORT' }),
            tags: z.array(z.string()).default(['x']).meta({ envName: 'APP_TAGS' }),
            debug: z.boolean().default(true).meta({ envName: 'APP_DEBUG' }),
        });
        expect(parseEnvConfig(defaults, { APP_PORT: '', APP_TAGS: '', APP_DEBUG: '' })).toEqual({
            port: 8080,
            tags: ['x'],
            debug: true,
        });
        const required = z.object({
            token: z.string().meta({ envName: 'APP_TOKEN', required: true }),
        });
        expect(() => parseEnvConfig(required, { APP_TOKEN: '' })).toThrow(ConfigParseError);
    });

    it('handles empty and multi-line scaffold content', () => {
        const empty = createConfigFile({ cwd: tempDir(), content: '' });
        expect(fs.readFileSync(empty, 'utf-8')).toContain('defineConfig({ toolchain: {} });');
        const multi = createConfigFile({
            cwd: tempDir(),
            content: '{\n  toolchain: {\n    enabled: true,\n  },\n}',
        });
        const source = fs.readFileSync(multi, 'utf-8');
        expect(source).toContain('defineConfig({');
        expect(source).not.toContain('(    {');
    });

    it('uses a synchronous loader and falls back past a TS config', () => {
        const loaded = tempDir();
        fs.writeFileSync(path.join(loaded, 'dbx.config.anything'), 'ignored');
        expect(
            loadConfigSync({
                cwd: loaded,
                names: ['dbx.config.anything'],
                loader: () => ({ a: 1 }),
            })?.config
        ).toEqual({ a: 1 });

        const fallback = tempDir();
        fs.writeFileSync(path.join(fallback, 'dbx.config.ts'), 'export default { a: 1 };');
        fs.writeFileSync(path.join(fallback, 'dbx.config.json'), '{"a":2}');
        expect(loadConfigSync({ cwd: fallback })?.config).toEqual({ a: 2 });

        const unsupported = tempDir();
        fs.writeFileSync(path.join(unsupported, 'dbx.config.anything'), 'ignored');
        expect(() => loadConfigSync({ cwd: unsupported, names: ['dbx.config.anything'] })).toThrow(
            /Unsupported config file/
        );
    });

    it('writes config:types under <root>/types by default', async () => {
        const cwd = tempDir();
        const typeDirs: string[] = [];
        const engine = {
            root: cwd,
            types: {
                write: ({ outputDir }: { outputDir: string }) => {
                    typeDirs.push(outputDir);
                    return [];
                },
            },
            env: {
                types: {
                    write: ({ outputDir }: { outputDir: string }) => {
                        typeDirs.push(outputDir);
                        return [];
                    },
                },
            },
        };
        const command = configCommands({ engine: engine as never }).find(
            entry => entry.name === 'config:types'
        )!;
        await command.run({} as never, {} as never);
        expect(typeDirs).toEqual([path.join(cwd, 'types')]);
    });

    it('writes config:all types under <root>/types by default', async () => {
        const cwd = tempDir();
        const typeDirs: string[] = [];
        const engine = {
            root: cwd,
            env: {
                write: ({ output }: { output: string }) => output,
                types: {
                    write: ({ outputDir }: { outputDir: string }) => {
                        typeDirs.push(outputDir);
                        return [];
                    },
                },
            },
            types: {
                write: ({ outputDir }: { outputDir: string }) => {
                    typeDirs.push(outputDir);
                    return [];
                },
            },
            markdown: { write: () => [] },
            jsonSchema: { write: async ({ output }: { output: string }) => output },
            configJson: { build: () => ({ env: [] }) },
            cli: { write: ({ output }: { output: string }) => output },
        };
        const all = configCommands({ engine: engine as never }).find(
            command => command.name === 'config:all'
        )!;
        await all.run({} as never, {} as never);
        expect(typeDirs).toEqual([path.join(cwd, 'types'), path.join(cwd, 'types')]);
    });
});

describe('session 9 hunt 2 regressions', () => {
    it('keeps duplicate env names per scope and nests by the schema scope', () => {
        const scoped = {
            server: z.object({ port: z.number().meta({ envName: 'APP_PORT' }) }),
            client: z.object({ port: z.number().meta({ envName: 'APP_PORT' }) }),
        };
        expect(parseEnvConfig(scoped, { APP_PORT: '1' })).toEqual({
            server: { port: 1 },
            client: { port: 1 },
        });

        const meta = {
            server: z.object({
                port: z
                    .number()
                    .meta({ envName: 'APP_PORT', cliFlag: '--port', scope: 'override' }),
            }),
        };
        expect(parseCliConfig(meta, ['--port', '1'])).toEqual({ server: { port: 1 } });

        const sameFlag = {
            server: z.object({
                port: z.number().meta({ envName: 'APP_SERVER_PORT', cliFlag: '--port' }),
            }),
            client: z.object({
                port: z.number().meta({ envName: 'APP_CLIENT_PORT', cliFlag: '--port' }),
            }),
        };
        expect(parseCliConfig(sameFlag, ['--port', '1'])).toEqual({
            server: { port: 1 },
            client: { port: 1 },
        });

        const sameMeta = {
            server: z.object({ port: z.number().meta({ envName: 'APP_PORT', scope: 'same' }) }),
            client: z.object({ port: z.number().meta({ envName: 'APP_PORT', scope: 'same' }) }),
        };
        expect(collectDefinitions(sameMeta).map(def => def.name)).toEqual(['APP_PORT', 'APP_PORT']);

        expect(
            parseEnvConfig(
                { 'a.b': z.object({ x: z.string().meta({ envName: 'APP_X' }) }) },
                { APP_X: 'v' }
            )
        ).toEqual({ 'a.b': { x: 'v' } });
    });

    it('matches scoped include/exclude paths', () => {
        const scoped = {
            server: z.object({ port: z.number().meta({ envName: 'APP_SERVER_PORT' }) }),
            client: z.object({ port: z.number().meta({ envName: 'APP_CLIENT_PORT' }) }),
        };
        const env = { APP_SERVER_PORT: '1', APP_CLIENT_PORT: '2' };
        expect(parseEnvConfig(scoped, env, { include: 'server.port' })).toEqual({
            server: { port: 1 },
        });
        expect(parseEnvConfig(scoped, env, { exclude: 'client.port' })).toEqual({
            server: { port: 1 },
        });
    });

    it('uses envSource when the env argument is omitted', () => {
        const host = z.object({
            host: z.string().meta({ envName: 'APP_HOST', required: true }),
        });
        expect(parseEnvConfig(host, undefined, { envSource: { APP_HOST: 'from-option' } })).toEqual(
            { host: 'from-option' }
        );
    });

    it('busts the CJS require cache with fresh', async () => {
        const cwd = tempDir();
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.cjs'),
            'module.exports = { n: process.env.__DBX_FRESH };'
        );
        try {
            process.env.__DBX_FRESH = '1';
            const asyncOne = await loadConfigAsync({ cwd, fresh: true });
            process.env.__DBX_FRESH = '2';
            const asyncTwo = await loadConfigAsync({ cwd, fresh: true });
            expect([asyncOne?.config, asyncTwo?.config]).toEqual([{ n: '1' }, { n: '2' }]);

            process.env.__DBX_FRESH = '3';
            const syncOne = loadConfigSync({ cwd, fresh: true });
            process.env.__DBX_FRESH = '4';
            const syncTwo = loadConfigSync({ cwd, fresh: true });
            expect([syncOne?.config, syncTwo?.config]).toEqual([{ n: '3' }, { n: '4' }]);
        } finally {
            delete process.env.__DBX_FRESH;
        }
    });

    it('handles negative decimals, -- and dash-prefixed strings', () => {
        const num = z.object({
            port: z.number().meta({ envName: 'APP_PORT', cliFlag: '--port' }),
        });
        const name = z.object({
            name: z.string().optional().meta({ envName: 'APP_NAME', cliFlag: '--name' }),
        });
        expect(parseCliConfig(num, ['--port', '-.5'])).toEqual({ port: -0.5 });
        expect(parseCliConfig(name, ['--', '--name', 'x'])).toEqual({});
        expect(parseCliConfig(name, ['--name=-foo'])).toEqual({ name: '-foo' });
        expect(parseCliConfig(name, ['--name', '-foo'])).toEqual({});
        expect(parseCliConfig(name, ['--name', '--unknown', 'x'])).toEqual({});
    });

    it('treats blank CLI values as unset', () => {
        const config = z.object({
            name: z.string().default('h').meta({ envName: 'APP_NAME', cliFlag: '--name' }),
            tags: z
                .array(z.string())
                .default(['x'])
                .meta({ envName: 'APP_TAGS', cliFlag: '--tag' }),
        });
        expect(parseCliConfig(config, ['--name=', '--tag', ''])).toEqual({
            name: 'h',
            tags: ['x'],
        });
        expect(parseCliConfig(config, ['--tag', 'a', '--tag', ''])).toEqual({
            name: 'h',
            tags: ['a'],
        });
    });

    it('rejects scaffold paths outside cwd', () => {
        const cwd = tempDir();
        expect(() => createConfigFile({ cwd, name: '../escape.ts' })).toThrow(/inside/);
        expect(() => createConfigFile({ cwd, name: '' })).toThrow(/file name/);
        expect(() => createConfigFile({ cwd, name: '.' })).toThrow(/file name/);
        fs.mkdirSync(path.join(cwd, 'dir'));
        expect(() => createConfigFile({ cwd, name: 'dir', overwrite: true })).toThrow(/directory/);
        expect(() =>
            createConfigFile({ cwd, name: path.resolve(cwd, '..', 'absolute.ts') })
        ).toThrow(/inside/);
        expect(fs.existsSync(createConfigFile({ cwd, name: 'nested/dbx.config.ts' }))).toBe(true);
    });
});
