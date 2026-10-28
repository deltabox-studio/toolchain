import { describe, expect, it } from 'vitest';
import { z } from 'zod';

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

    it('builds config metadata', () => {
        const doc = buildConfigJson(scopes, { envPrefix: 'MYAPP_' });
        expect(doc.env.length).toBeGreaterThan(3);
        expect(doc.version).toBe(1);
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
