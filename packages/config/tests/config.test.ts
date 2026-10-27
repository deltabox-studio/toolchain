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
    renderConfigFileMarkdown,
    renderConfigTypes,
    renderScopeMarkdown,
    resolveScopeSchema,
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

describe('renderConfigTypes', () => {
    it('strips the blank line untyped inserts between members', () => {
        const out = renderConfigTypes('cli', resolveScopeSchema(undefined, cliSchema), {
            interfaceNames: { cli: 'CliConfig' },
        });
        expect(out).toContain('export interface CliConfig {');
        // No empty line between members (or right after the opening brace).
        expect(out).not.toMatch(/;\n\n/);
        expect(out).not.toMatch(/\{\n\n/);
    });
});

describe('deprecation + examples', () => {
    const documentedSchema = z.object({
        old: z
            .string()
            .meta({
                deprecated: true,
                deprecationMessage: 'Use `fresh` instead.',
                example: ['one', 'two'],
            })
            .optional(),
        plain: z.string().meta({ deprecated: true }).optional(),
        fresh: z.string().optional(),
    });

    it('emits @deprecated and @example JSDoc tags', () => {
        const out = renderConfigTypes('demo', resolveScopeSchema(undefined, documentedSchema), {
            interfaceNames: { demo: 'DemoConfig' },
        });
        expect(out).toContain('@deprecated Use `fresh` instead.');
        expect(out).toContain('@example one');
        expect(out).toContain('@example two');
        expect(out).toContain('@deprecated\n');
        expect(out).not.toContain('@deprecated true');
        expect(out).not.toContain('@example one,two');
    });

    it('emits interface-level tags for a deprecated section', () => {
        const legacy = z.object({ old: z.string().optional() }).meta({
            id: 'LegacyConfig',
            deprecated: true,
            deprecationMessage: 'Use `fresh` instead.',
            example: 'legacy: true',
        });
        const out = renderConfigTypes('legacy', resolveScopeSchema(undefined, legacy), {
            interfaceNames: { legacy: 'LegacyConfig' },
        });
        expect(out).toContain('@deprecated Use `fresh` instead.');
        expect(out).toContain('@example legacy: true');
    });

    it('renders deprecated + example blocks in the config-file markdown', () => {
        const md = renderConfigFileMarkdown([
            { key: 'demo', description: 'Demo section.', schema: documentedSchema },
        ]);
        expect(md).toContain('- **Deprecated**: Use `fresh` instead.');
        expect(md).toContain('- **Deprecated**\n');
        expect(md).toContain('**Example(s):**');
        expect(md).toContain('one\n\ntwo');
        expect(md).not.toContain('@example');
    });

    it('renders deprecated + example blocks in the env markdown', () => {
        const md = renderScopeMarkdown('server', resolveScopeSchema(undefined, documentedSchema));
        expect(md).toContain('- **Deprecated**: Use `fresh` instead.');
        expect(md).toContain('- **Deprecated**\n');
        expect(md).toContain('**Example(s):**');
    });
});

describe('required metadata + tag options', () => {
    const schema = z.object({
        token: z
            .string()
            .meta({
                required: true,
                deprecated: true,
                deprecationMessage: 'Use `secret` instead.',
                example: 'abc',
            })
            .optional(),
    });

    it('emits @required and puts Required above Type', () => {
        const types = renderConfigTypes('demo', resolveScopeSchema(undefined, schema), {
            interfaceNames: { demo: 'DemoConfig' },
        });
        expect(types).toContain('@required');

        const configMd = renderConfigFileMarkdown([{ key: 'demo', schema }]);
        expect(configMd.indexOf('- **Required**')).toBeLessThan(configMd.indexOf('- **Type**'));

        const envMd = renderScopeMarkdown('server', resolveScopeSchema(undefined, schema));
        expect(envMd.indexOf('- **Required**')).toBeLessThan(envMd.indexOf('- **Type**'));
    });

    it('can suppress each annotation independently', () => {
        const types = renderConfigTypes('demo', resolveScopeSchema(undefined, schema), {
            interfaceNames: { demo: 'DemoConfig' },
            includeRequired: false,
            includeDeprecated: false,
            includeExamples: false,
        });
        expect(types).not.toContain('@required');
        expect(types).not.toContain('@deprecated');
        expect(types).not.toContain('@example');

        const configMd = renderConfigFileMarkdown([{ key: 'demo', schema }], {
            includeRequired: false,
            includeDeprecated: false,
            includeExamples: false,
        });
        expect(configMd).not.toContain('- **Required**');
        expect(configMd).not.toContain('- **Deprecated**');
        expect(configMd).not.toContain('**Example(s):**');

        const envMd = renderScopeMarkdown('server', resolveScopeSchema(undefined, schema), {
            includeRequired: false,
            includeDeprecated: false,
            includeExamples: false,
        });
        expect(envMd).not.toContain('- **Required**');
        expect(envMd).not.toContain('- **Deprecated**');
        expect(envMd).not.toContain('**Example(s):**');
    });
});

describe('additional annotations', () => {
    const schema = z.object({
        opt: z
            .string()
            .meta({
                since: '1.2.0',
                see: ['https://example.com/a', 'https://example.com/b'],
                remarks: 'Use this carefully.',
                experimental: true,
                alpha: true,
                beta: true,
            })
            .optional(),
    });

    it('renders since/see/remarks/stability annotations', () => {
        const types = renderConfigTypes('demo', resolveScopeSchema(undefined, schema), {
            interfaceNames: { demo: 'DemoConfig' },
        });
        expect(types).toContain('@since 1.2.0');
        expect(types).toContain('@see https://example.com/a');
        expect(types).toContain('@see https://example.com/b');
        expect(types).toContain('@remarks Use this carefully.');
        expect(types).toContain('@experimental');
        expect(types).toContain('@alpha');
        expect(types).toContain('@beta');

        const md = renderConfigFileMarkdown([{ key: 'demo', schema }]);
        expect(md).toContain('- **Since**: 1.2.0');
        expect(md).toContain('- **See**: https://example.com/a');
        expect(md).toContain('- **See**: https://example.com/b');
        expect(md).toContain('**Remarks:**');
        expect(md).toContain('- **Experimental**');
        expect(md).toContain('- **Alpha**');
        expect(md).toContain('- **Beta**');

        const envMd = renderScopeMarkdown('server', resolveScopeSchema(undefined, schema));
        expect(envMd).toContain('- **Since**: 1.2.0');
        expect(envMd).toContain('**Remarks:**');
    });

    it('can suppress the additional annotations', () => {
        const options = {
            includeSince: false,
            includeSee: false,
            includeRemarks: false,
            includeExperimental: false,
            includeAlpha: false,
            includeBeta: false,
        } as const;
        const types = renderConfigTypes('demo', resolveScopeSchema(undefined, schema), {
            interfaceNames: { demo: 'DemoConfig' },
            ...options,
        });
        expect(types).not.toContain('@since');
        expect(types).not.toContain('@see');
        expect(types).not.toContain('@remarks');
        expect(types).not.toContain('@experimental');
        expect(types).not.toContain('@alpha');
        expect(types).not.toContain('@beta');

        const md = renderConfigFileMarkdown([{ key: 'demo', schema }], options);
        expect(md).not.toContain('- **Since**');
        expect(md).not.toContain('- **See**');
        expect(md).not.toContain('**Remarks:**');
        expect(md).not.toContain('- **Experimental**');
        expect(md).not.toContain('- **Alpha**');
        expect(md).not.toContain('- **Beta**');
    });
});
