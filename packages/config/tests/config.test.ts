import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
    buildConfigJson,
    collectEnvVars,
    createCliArgsParser,
    createConfigEngine,
    envBool,
    envInt,
    envString,
    generateCliOptions,
    generateEnvFile,
    parseEnvTree,
    splitBaseSchema,
    zodToJsonSchema,
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
        .meta(envMeta('MYAPP_CLI_BASE_URL', { scope: 'cli' })),
    token: z.string().meta(envMeta('MYAPP_CLI_TOKEN', { scope: 'cli', secret: true })),
});

const scopes = { server: { zodSchema: serverSchema }, cli: { zodSchema: cliSchema } };

describe('env tree', () => {
    it('parses prefixed env vars into a nested tree', () => {
        const tree = parseEnvTree({ MYAPP_AUTH_PASSWORD: 'x', OTHER: 'y' }, 'MYAPP_');
        expect(tree).toEqual({ auth: { password: 'x' } });
        expect(envString(tree, 'auth.password')).toBe('x');
    });

    it('reads typed values', () => {
        const tree = parseEnvTree({ MYAPP_PORT: '3000', MYAPP_AUTH_ENABLED: 'no' }, 'MYAPP_');
        expect(envInt(tree, 'port', 8080)).toBe(3000);
        expect(envBool(tree, 'auth.enabled', true)).toBe(false);
    });
});

describe('collectEnvVars', () => {
    it('collects prefixed leaves with scope metadata', () => {
        const vars = collectEnvVars(scopes, 'MYAPP_');
        const names = vars.map(v => v.name);
        expect(names).toContain('MYAPP_HOST');
        expect(names).toContain('MYAPP_AUTH_PASSWORD');
        const password = vars.find(v => v.name === 'MYAPP_AUTH_PASSWORD');
        expect(password?.secret).toBe(true);
        expect(password?.required).toBe(true);
        expect(password?.path).toBe('auth.password');
        // scope defaults to the registered scope name
        expect(password?.scope).toBe('server');
    });
});

describe('generateEnvFile', () => {
    it('renders assignments, commenting secrets out', () => {
        const content = generateEnvFile(scopes, { envPrefix: 'MYAPP_' });
        expect(content).toContain('MYAPP_HOST=localhost');
        expect(content).toContain('# MYAPP_AUTH_PASSWORD=');
    });
});

describe('schema bridge', () => {
    it('splits the base group and resolves a schema', () => {
        const schema = zodToJsonSchema(serverSchema);
        const { base, groups, hasBase } = splitBaseSchema(schema);
        expect(hasBase).toBe(true);
        expect(base.properties?.host).toBeDefined();
        expect(groups.properties?.auth).toBeDefined();
    });
});

describe('config json / cli options', () => {
    it('builds the metadata doc', () => {
        const doc = buildConfigJson(scopes, { envPrefix: 'MYAPP_' });
        expect(doc.env.length).toBeGreaterThan(3);
        expect(doc.version).toBe(1);
    });

    it('generates CLI options for the cli scope', () => {
        const defs = generateCliOptions(scopes, {
            envPrefix: 'MYAPP_',
            shortFlags: { MYAPP_CLI_TOKEN: 'k' },
        });
        const token = defs.find(d => d.env === 'MYAPP_CLI_TOKEN');
        expect(token?.flag).toBe('--cli-token');
        expect(token?.short).toBe('-k');
        expect(token?.secret).toBe(true);
        // parser round-trips
        const parser = createCliArgsParser(defs);
        const parsed = parser.parse(['--cli-base-url', 'http://x']);
        expect(parsed.values['cli-base-url']).toBe('http://x');
    });
});

describe('createConfigEngine', () => {
    it('binds scopes and generates', async () => {
        const engine = createConfigEngine({ scopes, envPrefix: 'MYAPP_', root: process.cwd() });
        expect(engine.collectEnvVars().length).toBeGreaterThan(0);
        const schema = await engine.generateJsonSchema();
        expect(schema.$id).toBeDefined();
        const types = engine.renderConfigTypes();
        expect(Object.keys(types)).toEqual(['server', 'cli']);
    });
});
