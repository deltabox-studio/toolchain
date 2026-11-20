import { describe, expect, it } from 'vite-plus/test';

import { tsconfigCommands } from '../src/cli/index.js';
import {
    buildMonorepoTsconfig,
    renderMonorepoTsconfig,
    renderTsconfigBase,
    renderTsconfigBuild,
    renderTsconfigDefault,
    renderTsconfigTemplates,
} from '../src/index.js';

describe('tsconfig templates', () => {
    it('renders valid JSON with the env types token resolved by default', () => {
        for (const content of [
            renderTsconfigBase(),
            renderTsconfigDefault(),
            renderTsconfigBuild(),
        ]) {
            expect(() => JSON.parse(content)).not.toThrow();
            expect(content).not.toContain('{{');
        }
    });

    it('defaults the env types file to src/dbx-env.d.ts', () => {
        expect(JSON.parse(renderTsconfigDefault()).include).toContain('src/dbx-env.d.ts');
        expect(JSON.parse(renderTsconfigBuild()).include).toContain('src/dbx-env.d.ts');
    });

    it('honours a custom env types file', () => {
        const content = renderTsconfigDefault({ envTypesFile: 'types/custom-env.d.ts' });
        expect(JSON.parse(content).include).toContain('types/custom-env.d.ts');
    });

    it('renders every template keyed by file name', () => {
        const templates = renderTsconfigTemplates();
        expect(Object.keys(templates).sort()).toEqual([
            'tsconfig.base.json',
            'tsconfig.build.json',
            'tsconfig.default.json',
        ]);
        // The build config layers the managed editor config, not the source default.
        expect(JSON.parse(templates['tsconfig.build.json']!).extends).toBe('./tsconfig.json');
    });

    it('overrides the extends field per template', () => {
        const templates = renderTsconfigTemplates(
            {},
            {
                base: '@tsconfig/node22',
                default: false,
                build: './tsconfig.json',
            }
        );
        expect(JSON.parse(templates['tsconfig.base.json']!).extends).toBe('@tsconfig/node22');
        expect(JSON.parse(templates['tsconfig.default.json']!)).not.toHaveProperty('extends');
        expect(JSON.parse(templates['tsconfig.build.json']!).extends).toBe('./tsconfig.json');
    });
});

describe('monorepo tsconfig', () => {
    it('builds paths + references from workspaces', () => {
        const config = buildMonorepoTsconfig({
            scope: '@acme',
            workspaces: [
                { alias: 'core', dir: 'packages/core' },
                { alias: 'cli', dir: 'packages/cli' },
            ],
        });
        const paths = (config.compilerOptions as any).paths;
        expect(paths['@acme/core']).toEqual(['./packages/core/src/index.ts']);
        expect(paths['@acme/cli/*']).toEqual(['./packages/cli/src/*']);
        expect(config.references).toEqual([
            { path: './packages/core/tsconfig.json' },
            { path: './packages/cli/tsconfig.json' },
        ]);
    });

    it('serializes to JSON', () => {
        const json = renderMonorepoTsconfig({
            scope: '@acme',
            workspaces: [{ alias: 'core', dir: 'packages/core' }],
        });
        expect(() => JSON.parse(json)).not.toThrow();
    });
});

describe('tsconfig command options', () => {
    it('keeps config-backed flags generated from the schema', () => {
        const command = tsconfigCommands().find(candidate => candidate.name === 'tsconfig');
        const flags = (command?.options ?? []).map(option => option.flags);
        expect(flags).toContain('--no-aliases');
        expect(flags).toContain('--composite');
        expect(flags).toContain('--refs');
        expect(flags).toContain('--flatten-remote-extends');
        expect(flags).toContain('-i, --indent <value>');
        expect(flags).toContain('--glob <value...>');
        expect(flags).toContain('--no-gitignore');
        expect(flags).toContain('--root-file <value>');
    });
});
