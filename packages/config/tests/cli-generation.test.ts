import { describe, expect, it, vi } from 'vite-plus/test';
import { z } from 'zod';

import {
    configCliCommand,
    configFlagOf,
    createConfigEngine,
    generateCliOptions,
    generateConfigCliOptions,
    parseCliValue,
    toToolchainOptions,
} from '../src/index.js';

const schema = z.object({
    port: z.number().default(3000).describe('HTTP port'),
    host: z.string().default('localhost').describe('Bind address'),
    debug: z.boolean().default(false).describe('Debug logging'),
    tags: z.array(z.string()).default([]).describe('Tags'),
    auto: z.object({
        aliases: z.boolean().default(true).describe('Auto aliases'),
    }),
});

describe('config CLI options', () => {
    it('derives kebab-case flags from config paths', () => {
        expect(configFlagOf('auto.aliases')).toBe('--auto-aliases');
        expect(configFlagOf('flattenRemoteExtends')).toBe('--flatten-remote-extends');
        expect(configFlagOf('base.url')).toBe('--base-url');
    });

    it('generates scoped commands plus flat options', () => {
        const result = generateConfigCliOptions(schema);
        const command = result.command.config!;
        expect(command).toMatchObject({
            name: 'config',
            type: 'object',
            path: 'config',
            scope: 'config',
        });
        expect(command.options.map(def => def.flag)).toContain('--port');
        expect(result.commandEntries[0]?.[0]).toBe('config');
        expect(result.options).toHaveLength(command.options.length);
        expect(result.optionsEntries.length).toBe(result.options.length);
        expect(result.optionsEntries[0]?.[1]).toBe(result.options[0]);
    });

    it('generates metadata and value parsers for config fields', () => {
        const defs = generateConfigCliOptions(schema).options;
        const port = defs.find(def => def.path === 'port');
        expect(port).toMatchObject({
            flag: '--port',
            type: 'number',
            description: 'HTTP port',
            default: '3000',
        });
        expect(port?.parse?.('4000')).toBe(4000);

        const tags = defs.find(def => def.path === 'tags');
        expect(tags?.multiple).toBe(true);
        expect(tags?.parse?.('a, b')).toEqual(['a', 'b']);

        expect(defs.find(def => def.path === 'auto.aliases')?.flag).toBe('--auto-aliases');
    });

    it('supports path prefixes, flag overrides and type overrides', () => {
        const defs = generateConfigCliOptions(schema, {
            pathPrefix: 'auto.',
            flags: { 'auto.aliases': '--aliases' },
            types: { 'auto.aliases': 'boolean' },
        }).options;
        expect(defs).toHaveLength(1);
        expect(defs[0]).toMatchObject({
            flag: '--aliases',
            path: 'auto.aliases',
            type: 'boolean',
        });
        expect(defs[0]?.parse?.('yes')).toBe(true);
    });

    it('maps generated options to commander-ready flags', () => {
        const defs = generateConfigCliOptions(schema).options;
        const options = toToolchainOptions(defs);
        expect(options).toContainEqual({
            flags: '--port <value>',
            description: 'HTTP port',
            default: '3000',
        });
        expect(options).toContainEqual({
            flags: '--debug',
            description: 'Debug logging',
            default: 'false',
        });
        expect(options).toContainEqual({
            flags: '--tags <value...>',
            description: 'Tags',
            default: '',
        });
    });

    it('coerces raw CLI values by type', () => {
        expect(parseCliValue('yes', 'boolean')).toBe(true);
        expect(parseCliValue('off', 'boolean')).toBe(false);
        expect(parseCliValue('42', 'number')).toBe(42);
        expect(parseCliValue('a,b', 'array')).toEqual(['a', 'b']);
        expect(parseCliValue('x', 'string')).toBe('x');
    });

    it('treats schema scopes as commands', () => {
        const scoped = {
            serve: z.object({ port: z.number().default(3000) }),
            build: z.object({ outDir: z.string().default('dist') }),
        };
        const result = generateConfigCliOptions(scoped);
        expect(result.command.serve).toMatchObject({ name: 'serve', type: 'object' });
        expect(result.command.build).toMatchObject({ name: 'build', type: 'object' });
        expect(result.command.serve?.options.map(def => def.flag)).toEqual(['--port']);
        expect(result.command.build?.options.map(def => def.flag)).toEqual(['--out-dir']);
        expect(result.commandEntries.map(([name]) => name)).toEqual(['serve', 'build']);
        expect(result.options.map(def => def.flag)).toEqual(['--port', '--out-dir']);
    });

    it('exposes the scoped result through engine.cli.options()', () => {
        const engine = createConfigEngine({
            schema: {
                serve: z.object({ port: z.number().default(3000) }),
                build: z.object({ outDir: z.string().default('dist') }),
            },
        });
        const result = engine.cli.options();
        expect(result.command.serve?.name).toBe('serve');
        expect(result.command.build?.options.map(def => def.flag)).toEqual(['--out-dir']);
        expect(result.commandEntries).toHaveLength(2);
    });

    it('parses env-backed options too', () => {
        const envSchema = z.object({
            base: z.object({
                port: z.number().meta({ envName: 'APP_PORT', scope: 'cli' }),
            }),
        });
        const defs = generateCliOptions(envSchema, { envPrefix: 'APP_' });
        expect(defs[0]).toMatchObject({
            flag: '--port',
            env: 'APP_PORT',
            type: 'number',
            scope: 'cli',
            path: 'base.port',
        });
        expect(defs[0]?.parse?.('8080')).toBe(8080);
    });
});

describe('config CLI commands', () => {
    it('builds a ToolchainCommand and parses provided values', async () => {
        const run = vi.fn();
        const command = configCliCommand({
            name: 'serve',
            description: 'Run the server.',
            schema,
            run,
        });

        expect(command.name).toBe('serve');
        expect(command.options).toContainEqual({
            flags: '--port <value>',
            description: 'HTTP port',
            default: '3000',
        });

        await command.run({ port: 4000, debug: true }, {} as never);

        expect(run).toHaveBeenCalledTimes(1);
        const [values, parsed] = run.mock.calls[0]!;
        expect(values).toMatchObject({ port: 4000, debug: true });
        expect(parsed).toMatchObject({ port: 4000, debug: true, host: 'localhost' });
    });

    it('selects a scoped command and wraps parsed values', async () => {
        const run = vi.fn();
        const command = configCliCommand({
            name: 'serve',
            description: 'Run the server.',
            schema: { serve: z.object({ port: z.number().default(3000) }) },
            commandName: 'serve',
            run,
        });
        await command.run({ port: 4000 }, {} as never);
        expect(run.mock.calls[0]![1]).toEqual({ serve: { port: 4000 } });
        expect(command.options).toContainEqual({
            flags: '--port <value>',
            description: 'Set `port`.',
            default: '3000',
        });
    });

    it('supports a custom parse callback', async () => {
        const run = vi.fn();
        const command = configCliCommand({
            name: 'serve',
            description: 'Run the server.',
            schema,
            parse: values => ({ parsedBy: 'custom', values }),
            run,
        });
        await command.run({ port: 1 }, {} as never);
        expect(run.mock.calls[0]![1]).toEqual({ parsedBy: 'custom', values: { port: 1 } });
    });
});
