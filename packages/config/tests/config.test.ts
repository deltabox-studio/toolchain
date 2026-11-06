import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { dbxConfigSchema } from '@deltabox/toolchain/shared';

import {
    buildConfigJson,
    collectVars,
    createCliArgsParser,
    createConfigEngine,
    envBool,
    envInt,
    envPathOf,
    envString,
    generateCliOptions,
    generateConfigEnv,
    generateConfigJsonSchema,
    generateConfigMarkdown,
    generateConfigTypes,
    generateEnvFile,
    metaOf,
    parseEnvTree,
} from '../src/index.js';

const envMeta = (env: string, extra: Record<string, unknown> = {}) => ({ env, ...extra });

const serverSchema = z.object({
    base: z.object({
        host: z
            .string()
            .default('localhost')
            .meta(envMeta('MYAPP_HOST', { scope: 'server', description: 'Bind host' })),
        port: z
            .number()
            .int()
            .default(8080)
            .meta(envMeta('MYAPP_PORT', { scope: 'server' })),
    }),
    auth: z.object({
        password: z
            .string()
            .meta(
                envMeta('MYAPP_AUTH_PASSWORD', { scope: 'server', secret: true, required: true })
            ),
        enabled: z
            .boolean()
            .default(true)
            .meta(envMeta('MYAPP_AUTH_ENABLED', { scope: 'server' })),
    }),
});

const cliSchema = z.object({
    baseUrl: z
        .string()
        .default('http://localhost:8080')
        .meta({ envName: 'MYAPP_CLI_BASE_URL', scope: 'cli', cliFlag: '--base-url' }),
    token: z
        .string()
        .meta({ envName: 'MYAPP_CLI_TOKEN', scope: 'cli', secret: true, cliFlagShort: 'k' }),
});

const scopes = { server: serverSchema, cli: cliSchema };

describe('env tree', () => {
    it('parses prefixed env vars into a nested tree', () => {
        const tree = parseEnvTree({ MYAPP_AUTH_PASSWORD: 'x', OTHER: 'y' }, 'MYAPP_');
        expect(tree).toEqual({ auth: { password: 'x' } });
        expect(envString(tree, 'auth.password')).toBe('x');
    });

    it('reads typed values and derives dotted paths', () => {
        const tree = parseEnvTree({ MYAPP_PORT: '3000', MYAPP_AUTH_ENABLED: 'no' }, 'MYAPP_');
        expect(envInt(tree, 'port', 8080)).toBe(3000);
        expect(envBool(tree, 'auth.enabled', true)).toBe(false);
        expect(envPathOf('MYAPP_AUTH_TOKEN_TTL', 'MYAPP_')).toBe('auth.token.ttl');
        expect(metaOf(z.string().meta({ env: 'MYAPP_HOST' }))).toEqual({ env: 'MYAPP_HOST' });
    });
});

describe('collectVars', () => {
    it('collects scoped leaves with env metadata', () => {
        const vars = collectVars(scopes, 'MYAPP_');
        expect(vars.map(v => v.name)).toContain('MYAPP_HOST');
        const password = vars.find(v => v.name === 'MYAPP_AUTH_PASSWORD');
        expect(password?.secret).toBe(true);
        expect(password?.required).toBe(true);
        expect(password?.path).toBe('auth.password');
        expect(password?.scope).toBe('server');
    });
});

describe('generators', () => {
    it('generates env files, types, markdown and CLI definitions', () => {
        expect(generateEnvFile(scopes, { envPrefix: 'MYAPP_' })).toContain('MYAPP_HOST=localhost');

        const types = generateConfigTypes(scopes);
        expect(Object.keys(types)).toEqual(['server', 'cli']);
        expect(types.server).toContain('export interface ServerConfig');

        const markdown = generateConfigMarkdown(scopes);
        expect(markdown['server.md']).toContain('---');
        expect(markdown['server.md']).toContain('title: Server Configuration');
        expect(generateConfigMarkdown(scopes, { frontmatter: false })['server.md']).not.toContain(
            '---'
        );

        const defs = generateCliOptions(scopes, { envPrefix: 'MYAPP_' });
        const token = defs.find(d => d.env === 'MYAPP_CLI_TOKEN');
        expect(token?.flag).toBe('--cli-token');
        expect(token?.short).toBe('-k');
        expect(token?.secret).toBe(true);
        const parser = createCliArgsParser(defs);
        expect(parser.parse(['--base-url', 'http://x']).values['base-url']).toBe('http://x');
    });

    it('supports custom frontmatter strings and callbacks', () => {
        const custom = generateConfigMarkdown(scopes, {
            frontmatter: ctx => `title: ${ctx.options.title ?? 'Custom'}`,
            title: 'Custom',
        });
        expect(custom['server.md']).toContain('title: Custom');
        const raw = generateConfigMarkdown(scopes, { frontmatter: 'draft: true' });
        expect(raw['server.md']).toContain('draft: true');
    });

    it('shows env/cli equivalents in types and markdown', () => {
        const types = generateConfigTypes(cliSchema);
        expect(Object.values(types)[0]).toContain('@env MYAPP_CLI_BASE_URL');
        expect(Object.values(types)[0]).toContain('@cli --base-url');
        const markdown = generateConfigMarkdown(cliSchema);
        const cliMarkdown = Object.values(markdown)[0] ?? '';
        expect(cliMarkdown).toContain('- **Env**: `MYAPP_CLI_BASE_URL`');
        expect(cliMarkdown).toContain('- **CLI**: `--base-url`');
    });

    it('keeps union, enum and nested types in the combined reference', () => {
        const section = z
            .object({
                kind: z.enum(['a', 'b']).describe('The kind.').optional(),
                glob: z
                    .union([z.string(), z.array(z.string())])
                    .describe('Glob(s).')
                    .optional(),
                nested: z
                    .union([
                        z.boolean(),
                        z.object({ depth: z.number().describe('Depth.').optional() }),
                    ])
                    .describe('Nested settings.')
                    .optional(),
            })
            .describe('A section.')
            .meta({ id: 'SectionConfig' });
        const markdown = generateConfigMarkdown({ section }, { combined: true })['index.md']!;
        expect(markdown).toContain('A section.');
        expect(markdown).toContain("- **Type**: `'a' | 'b'`");
        expect(markdown).toContain('- **Type**: `string | Array<string>`');
        expect(markdown).toContain('#### `depth`');
        expect(markdown).not.toContain('`any`');
        expect(markdown).not.toContain('- **Default**: `{}`');
    });

    it('builds config metadata', () => {
        const doc = buildConfigJson(scopes, { envPrefix: 'MYAPP_' });
        expect(doc.env.length).toBeGreaterThan(3);
        expect(doc.version).toBe(1);
    });

    it('renders object-level metadata in per-scope markdown', () => {
        const schema = z.object({
            section: z
                .object({
                    nested: z.object({ value: z.string().optional() }).describe('Nested settings.'),
                })
                .describe('A section.'),
        });
        const markdown = generateConfigMarkdown({ config: schema })['config.md']!;
        expect(markdown).toContain('A section.');
        expect(markdown).toContain('Nested settings.');
    });

    it('rejects generated paths that escape the output directory', () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-config-out-'));
        try {
            const escaping = { '../escape': z.object({ value: z.string().optional() }) };
            expect(() => generateConfigTypes(escaping, { outputDir: cwd })).toThrow(/outside/);
            expect(() => generateConfigMarkdown(escaping, { outputDir: cwd })).toThrow(/outside/);
            expect(() => generateConfigEnv({}, { outputDir: cwd, envFile: '../env.ts' })).toThrow(
                /outside/
            );
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });
});

describe('createConfigEngine', () => {
    it('binds a schema and generates', async () => {
        const engine = createConfigEngine({ schema: scopes, envPrefix: 'MYAPP_' });
        expect(engine.collectVars().length).toBeGreaterThan(0);
        const schema = await engine.generateJsonSchema();
        expect(schema.$id).toBeDefined();
        expect(Object.keys(engine.generateConfigTypes())).toEqual(['server', 'cli']);
    });
});

describe('dbx config schema', () => {
    it('can be lowered to JSON Schema and generated types', async () => {
        const engine = createConfigEngine({ schema: dbxConfigSchema });
        await expect(engine.generateJsonSchema()).resolves.toBeDefined();
        expect(() => engine.generateConfigTypes()).not.toThrow();
    });
});

describe('named nested schemas', () => {
    const schema = z.object({
        auth: z
            .object({
                token: z.string().meta({ envName: 'APP_TOKEN', scope: 'server' }),
            })
            .meta({ id: 'Auth' }),
    });

    it('collects env vars below a named `$ref`', () => {
        const vars = collectVars({ server: schema }, 'APP_');
        expect(vars.map(variable => variable.name)).toContain('APP_TOKEN');
        expect(vars.find(variable => variable.name === 'APP_TOKEN')?.path).toBe('auth.token');
    });

    it('keeps the named properties in the generated JSON Schema', async () => {
        const doc = await generateConfigJsonSchema({ server: schema });
        const server = doc.properties as Record<string, { properties?: Record<string, unknown> }>;
        const auth = server.server?.properties?.auth as
            | { properties?: Record<string, unknown> }
            | undefined;
        expect(auth?.properties?.token).toBeDefined();
    });
});

describe('secret defaults and envPathOf', () => {
    const secretSchema = z.object({
        token: z.string().default('s3cret').meta({ envName: 'APP_TOKEN', secret: true }),
    });

    it('does not serialize a secret default', () => {
        const doc = buildConfigJson({ server: secretSchema }, { envPrefix: 'APP_' });
        expect(doc.env.find(entry => entry.name === 'APP_TOKEN')?.default).toBeUndefined();
    });

    it('does not render a secret default in markdown', () => {
        const markdown = generateConfigMarkdown({ server: secretSchema });
        expect(markdown['server.md']).not.toContain('s3cret');
    });

    it('uses envPathOf for the dotted path', () => {
        const schema = z.object({
            baseUrl: z.string().meta({ envName: 'APP_CLI_BASE_URL' }),
        });
        const vars = collectVars({ server: schema }, 'APP_', {
            envPathOf: () => 'cli.base.url',
        });
        expect(vars.find(variable => variable.name === 'APP_CLI_BASE_URL')?.path).toBe(
            'cli.base.url'
        );
    });

    it('shows envName-backed core variables in the index', () => {
        const schema = z.object({
            host: z.string().meta({ envName: 'APP_HOST' }),
        });
        expect(generateConfigMarkdown({ server: schema })['index.md']).toContain('APP_HOST');
    });
});

describe('duplicate env names', () => {
    it('keeps the first declaration', () => {
        const schema = z.object({
            a: z.string().meta({ envName: 'APP_TOKEN' }),
            b: z.string().meta({ envName: 'APP_TOKEN' }),
        });
        const vars = collectVars({ server: schema }, 'APP_');
        expect(vars.filter(variable => variable.name === 'APP_TOKEN')).toHaveLength(1);
    });
});
