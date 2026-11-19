import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import {
    buildConfigJson,
    collectDefinitions,
    createConfigEngine,
    findProjectRoot,
    generateCliOptions,
    generateConfigEnv,
    generateConfigJsonSchema,
    generateConfigMarkdown,
    generateConfigTypes,
    generateEnvFile,
    generateEnvMarkdown,
} from '../src/index.js';

describe('path-derived env metadata', () => {
    const schema = z.object({
        token: z.string().meta({ required: true, description: 'API token' }),
        port: z.number().default(3000),
    });

    it('includes path-derived names in the index, env markdown and config.json', () => {
        const vars = collectDefinitions(schema);
        expect(vars.map(def => def.name)).toEqual([undefined, undefined]);

        const index = generateConfigMarkdown(schema)['index.md']!;
        expect(index).toContain('| `APP_TOKEN` |');
        expect(index).toContain('| `APP_PORT` | `3000` |');

        const envMarkdown = generateEnvMarkdown(vars);
        expect(envMarkdown).toContain('| `APP_TOKEN` |');
        expect(envMarkdown).toContain('| `APP_PORT` | config | `3000` |');

        const configJson = buildConfigJson(schema);
        expect(configJson.env.map(entry => entry.name)).toEqual(['APP_TOKEN', 'APP_PORT']);
        expect(configJson.env.find(entry => entry.name === 'APP_TOKEN')?.required).toBe(true);
        expect(configJson.env.find(entry => entry.name === 'APP_PORT')?.default).toBe(3000);
    });
});

describe('named complex leaves', () => {
    const schema = z.object({
        record: z
            .record(z.string(), z.string())
            .default({ a: 'b' })
            .meta({ envName: 'APP_RECORD', scope: 'cli', cliFlag: '--record' }),
        list: z
            .array(z.string())
            .default([])
            .meta({ envName: 'APP_LIST', scope: 'cli', cliFlag: '--list' }),
    });

    it('omits records from env/CLI generation even when named', () => {
        const env = generateEnvFile(schema);
        expect(env).not.toContain('APP_RECORD');
        expect(env).toContain('APP_LIST=');

        const types = generateConfigEnv(schema)['env.ts']!;
        expect(types).not.toContain('APP_RECORD');
        expect(types).toContain('APP_LIST?: string;');

        expect(generateCliOptions(schema).map(def => def.env)).toEqual(['APP_LIST']);
        expect(buildConfigJson(schema).env.map(entry => entry.name)).toEqual(['APP_LIST']);

        const envMarkdown = generateEnvMarkdown(collectDefinitions(schema));
        expect(envMarkdown).not.toContain('APP_RECORD');
        expect(envMarkdown).toContain('APP_LIST');
    });
});

describe('combined markdown base group', () => {
    const schema = z.object({
        base: z.object({ host: z.string().default('localhost') }),
        auth: z.object({ token: z.string().optional() }),
    });

    it('flattens the base group in combined and per-scope output', () => {
        const perScope = generateConfigMarkdown({ server: schema })['server.md']!;
        expect(perScope).toContain('## Base');
        expect(perScope).toContain('## Auth');
        expect(perScope).toContain('### `host`');

        const combined = generateConfigMarkdown({ server: schema }, { combined: true })[
            'index.md'
        ]!;
        expect(combined).toContain('## `server`');
        expect(combined).toContain('### `host`');
        expect(combined).toContain('### `auth`');
        expect(combined).toContain('#### `token`');
        expect(combined).not.toContain('### `base`');
    });
});

describe('JSON Schema base group required', () => {
    it('does not require base children when the base group is optional', async () => {
        const schema = z.object({
            base: z.object({ host: z.string() }).optional(),
        });
        const doc = await generateConfigJsonSchema({ server: schema });
        const node = (
            doc.properties as Record<
                string,
                { properties?: Record<string, unknown>; required?: string[] }
            >
        ).server!;

        expect(node.properties?.base).toBeUndefined();
        expect(node.properties?.host).toBeDefined();
        expect(node.required ?? []).not.toContain('host');
    });

    it('promotes base children when the base group is required', async () => {
        const schema = z.object({
            base: z.object({ host: z.string() }),
        });
        const doc = await generateConfigJsonSchema({ server: schema });
        const node = (doc.properties as Record<string, Record<string, unknown>>).server!;

        expect(node.required).toEqual(['host']);
    });
});

describe('object required metadata', () => {
    it('does not crash any generator', async () => {
        const schema = z.object({
            section: z.object({ value: z.string().optional() }).meta({ required: true }),
        });
        const scoped = { server: schema };

        expect(() => generateConfigTypes(scoped)).not.toThrow();
        expect(() => generateConfigMarkdown(scoped)).not.toThrow();
        expect(() => generateEnvFile(scoped)).not.toThrow();
        expect(() => generateCliOptions(scoped)).not.toThrow();
        expect(() => buildConfigJson(scoped)).not.toThrow();
        await expect(generateConfigJsonSchema(scoped)).resolves.toBeDefined();
    });
});

describe('preserved definitions', () => {
    it('throws on duplicate $defs ids across scopes', async () => {
        const one = z.object({ a: z.object({ x: z.string() }).meta({ id: 'Shared' }) });
        const two = z.object({ b: z.object({ y: z.number() }).meta({ id: 'Shared' }) });

        await expect(
            generateConfigJsonSchema({ one, two }, { preserveDefs: true })
        ).rejects.toThrow(/duplicate \$defs id "Shared"/);
    });

    it('flattens the base group inside the preserved root definition', async () => {
        const schema = z
            .object({
                base: z.object({ host: z.string() }),
                auth: z.object({ token: z.string().optional() }).optional(),
            })
            .meta({ id: 'ServerRoot' });
        const doc = await generateConfigJsonSchema({ server: schema }, { preserveDefs: true });
        const defs = doc.$defs as Record<
            string,
            { properties?: Record<string, unknown>; required?: string[] }
        >;
        const root = defs.ServerRoot!;

        expect((doc.properties as Record<string, Record<string, unknown>>).server?.$ref).toBe(
            '#/$defs/ServerRoot'
        );
        expect(root.properties?.base).toBeUndefined();
        expect(root.properties?.host).toBeDefined();
        expect(root.required).toEqual(['host']);
    });
});

describe('engine root and write paths', () => {
    it('defaults root to the project root of the current directory', () => {
        const engine = createConfigEngine({ schema: z.object({ port: z.number() }) });
        expect(engine.root).toBe(findProjectRoot(process.cwd()));
    });

    it('resolves relative write paths under root', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-engine-root-'));
        try {
            const engine = createConfigEngine({
                schema: z.object({ port: z.number() }),
                root,
            });
            const typeFiles = engine.types.write({ outputDir: 'generated/types' });
            expect(typeFiles[0]).toBe(path.join(root, 'generated', 'types', 'config.ts'));
            expect(fs.existsSync(typeFiles[0]!)).toBe(true);

            const doc = engine.markdown.file.write({
                output: 'docs/index.md',
                title: 'Index',
                body: 'Body.',
            });
            expect(doc).toBe(path.join(root, 'docs', 'index.md'));
            expect(fs.existsSync(doc)).toBe(true);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('generated env file import path', () => {
    it('derives the ambient import from a custom nested envFile', () => {
        const schema = z.object({ port: z.number() });
        const files = generateConfigEnv(schema, {
            envFile: 'types/app-env.ts',
            dtsFile: 'types/app-env.d.ts',
        });
        expect(files['types/app-env.d.ts']).toContain("from './app-env.js'");

        const windows = generateConfigEnv(schema, { envFile: 'types\\app-env.ts' });
        expect(windows['dbx-env.d.ts']).toContain("from './app-env.js'");
    });
});

describe('generated JSDoc', () => {
    it('escapes a comment terminator in descriptions and examples', () => {
        const schema = z.object({
            host: z.string().describe('Danger */ here').meta({ example: 'a */ b' }),
        });
        const types = generateConfigTypes({ server: schema })['server']!;

        expect(types).toContain('Danger *\\/ here');
        expect(types).not.toContain('Danger */ here');
        expect(types).toContain('a *\\/ b');
    });

    it('escapes comment terminators in generated env types', () => {
        const schema = z.object({
            server: z.object({
                watch: z
                    .string()
                    .default('src/**/*.ts')
                    .describe('Files to watch, e.g. src/**/*.ts')
                    .meta({ envName: 'MYAPP_WATCH' }),
            }),
        });
        const files = generateConfigEnv(schema, {
            envPrefix: 'MYAPP_',
            envComment: 'Public env */ comment\non two lines',
            header: 'Header */ text',
        });
        const env = files['env.ts']!;
        const dts = files['dbx-env.d.ts']!;

        expect(env).toContain('MYAPP_WATCH?: string;');
        expect(env).toContain('src/**\\/*.ts');
        expect(env).toContain('Public env *\\/ comment on two lines');
        expect(env).toContain('Header *\\/ text');
        expect(env).not.toContain('src/**/*.ts');
        expect(env).not.toContain('Public env */ comment');
        expect(env).not.toContain('Header */ text');
        expect(dts).toContain('Header *\\/ text');
        expect(dts).not.toContain('Header */ text');
    });
});
