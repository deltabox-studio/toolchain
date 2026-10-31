import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { SyncTask, ToolchainCommandContext } from '@deltabox/toolchain-shared';

import {
    detectMigrations,
    diffFiles,
    ensureViteFmtIgnore,
    extractViteObject,
    foldViteIntoConfig,
    hasPending,
    listMigrations,
    mapBiomeFormatter,
    mapPrettierToOxfmt,
    mergeViteConfig,
    mergeViteObjects,
    migrateCommands,
    readJsonc,
    renderViteTarget,
    runMigration,
    scanLiteralObject,
} from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-migrate-'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const BIOME = {
    formatter: { indentStyle: 'space', indentWidth: 4, lineWidth: 100, lineEnding: 'lf' },
    javascript: {
        formatter: {
            quoteStyle: 'single',
            jsxQuoteStyle: 'double',
            semicolons: 'always',
            trailingCommas: 'es5',
            arrowParentheses: 'asNeeded',
        },
    },
    files: { includes: ['**/*.{ts,js}', '!**/*/dist', '!**/node_modules'] },
    assist: {
        actions: {
            source: {
                organizeImports: {
                    options: {
                        groups: [[':NODE:'], ':BLANK_LINE:', [':PACKAGE:'], ['@/**'], [':PATH:']],
                    },
                },
            },
        },
    },
    linter: {
        rules: {
            correctness: { noUnusedVariables: 'warn' },
            suspicious: { noDoubleEquals: 'warn', noExplicitAny: 'off' },
        },
    },
};

describe('readJsonc', () => {
    it('parses comments and trailing commas', () => {
        const dir = makeTmp();
        const file = path.join(dir, 'biome.jsonc');
        fs.writeFileSync(
            file,
            '{\n  // a comment\n  "a": 1, /* block */\n  "b": [1, 2,],\n}\n',
            'utf-8'
        );
        expect(readJsonc(file)).toEqual({ a: 1, b: [1, 2] });
    });
});

describe('biome -> oxc', () => {
    it('maps formatter, ignore, sortImports and rules', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');

        const result = await runMigration('biome', { cwd: dir, write: true });

        const oxfmt = result.oxfmt as Record<string, any>;
        expect(oxfmt.useTabs).toBe(false);
        expect(oxfmt.tabWidth).toBe(4);
        expect(oxfmt.printWidth).toBe(100);
        expect(oxfmt.singleQuote).toBe(true);
        expect(oxfmt.jsxSingleQuote).toBe(false);
        expect(oxfmt.semi).toBe(true);
        expect(oxfmt.trailingComma).toBe('es5');
        expect(oxfmt.arrowParens).toBe('avoid');
        expect(oxfmt.ignorePatterns).toContain('**/*/dist');
        expect(oxfmt.sortImports.groups[0]).toBe('builtin');
        expect(oxfmt.sortImports.groups).toContain('internal');
        expect(oxfmt.sortImports.internalPattern).toContain('@/');

        const oxlint = result.oxlint as Record<string, any>;
        expect(oxlint.rules['no-unused-vars']).toBe('warn');
        expect(oxlint.rules.eqeqeq).toBe('warn');
        expect(oxlint.rules['typescript/no-explicit-any']).toBe('off');

        expect(fs.existsSync(path.join(dir, '.oxfmtrc.json'))).toBe(true);
        expect(fs.existsSync(path.join(dir, '.oxlintrc.json'))).toBe(true);
    });

    it('does not write without --write', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');
        await runMigration('biome', { cwd: dir });
        expect(fs.existsSync(path.join(dir, '.oxfmtrc.json'))).toBe(false);
    });
});

describe('biome -> oxc unmapped', () => {
    it('reports jsxQuoteStyle from javascript.formatter, not formatter', () => {
        const { unmapped } = mapBiomeFormatter({
            javascript: { formatter: { jsxQuoteStyle: 'double' } },
        });
        expect(unmapped).toContainEqual({
            source: 'javascript.formatter.jsxQuoteStyle',
            reason: 'no Oxfmt equivalent',
        });
        // A top-level `formatter.jsxQuoteStyle` is not where Biome stores it.
        expect(mapBiomeFormatter({ formatter: { jsxQuoteStyle: 'double' } }).unmapped).toHaveLength(
            0
        );
    });
});

describe('prettier -> oxc', () => {
    it('maps options and detects plugins', () => {
        const mapped = mapPrettierToOxfmt({
            semi: false,
            singleQuote: true,
            printWidth: 80,
            plugins: ['prettier-plugin-tailwindcss', 'some-other-plugin'],
        });
        expect(mapped.oxfmt.semi).toBe(false);
        expect(mapped.oxfmt.singleQuote).toBe(true);
        expect(mapped.oxfmt.printWidth).toBe(80);
        expect(mapped.oxfmt.sortTailwindcss).toBe(true);
        expect(mapped.unmapped).toContain('plugin: some-other-plugin');
    });
});

describe('eslint -> oxc', () => {
    it('maps rule names and severities', async () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, '.eslintrc.json'),
            JSON.stringify({
                rules: {
                    'no-unused-vars': 'warn',
                    '@typescript-eslint/no-explicit-any': 2,
                    'import/order': 'off',
                },
            }),
            'utf-8'
        );
        const result = await runMigration('eslint', { cwd: dir, write: true });
        const oxlint = result.oxlint as Record<string, any>;
        expect(oxlint.rules['no-unused-vars']).toBe('warn');
        expect(oxlint.rules['typescript/no-explicit-any']).toBe('error');
        expect(oxlint.rules['import/order']).toBe('off');
    });
});

describe('migrate --target vite', () => {
    it('renders a fresh vite.config.ts', () => {
        const out = mergeViteConfig(undefined, {
            fmt: { semi: true, singleQuote: true },
            lint: { rules: { eqeqeq: 'warn' } },
        });
        expect(out).toContain("import { defineConfig } from 'vite-plus';");
        expect(out).toContain('fmt: {');
        expect(out).toContain("eqeqeq: 'warn'");
    });

    it('inserts and replaces fmt/lint in an existing config', () => {
        const existing = `import { defineConfig } from 'vite-plus';\n\nexport default defineConfig({\n    test: { include: ['x'] },\n    fmt: { semi: false },\n});\n`;
        const out = mergeViteConfig(existing, { fmt: { semi: true }, lint: { rules: {} } });
        expect(out).toContain("test: { include: ['x'] }");
        expect(out).toContain('semi: true');
        expect(out).not.toContain('semi: false');
        expect(out).toContain('lint: {');
    });
});

describe('registry', () => {
    it('detects present configs', () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), '{}', 'utf-8');
        expect(detectMigrations(dir).map(m => m.id)).toContain('biome-to-oxc');
        const infos = listMigrations(dir);
        expect(infos.find(info => info.id === 'biome-to-oxc')?.detected).toBe(true);
    });

    it('detects several sources at once (--from all)', () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), '{}', 'utf-8');
        fs.writeFileSync(path.join(dir, '.prettierrc'), '{}', 'utf-8');
        const ids = detectMigrations(dir).map(m => m.id);
        expect(ids).toContain('biome-to-oxc');
        expect(ids).toContain('prettier-to-oxc');
    });

    it('detects a hand-written Oxc config', () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, '.oxfmtrc.json'), '{}', 'utf-8');
        expect(detectMigrations(dir).map(m => m.id)).toContain('oxc-to-toolchain');
    });
});

describe('oxc -> toolchain', () => {
    it('folds .oxfmtrc.json / .oxlintrc.json into toolchain.fmt/lint.oxc', async () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'dbx.config.ts'),
            "import { defineConfig } from '@deltabox/toolchain';\n\nexport default defineConfig({ toolchain: {} });\n",
            'utf-8'
        );
        fs.writeFileSync(
            path.join(dir, '.oxfmtrc.json'),
            JSON.stringify({ $schema: './schema.json', semi: false, printWidth: 90 }),
            'utf-8'
        );
        fs.writeFileSync(
            path.join(dir, '.oxlintrc.json'),
            JSON.stringify({ rules: { eqeqeq: 'error' }, ignorePatterns: ['dist/**'] }),
            'utf-8'
        );

        const result = await runMigration('oxc', { cwd: dir, write: true });
        const config = fs.readFileSync(path.join(dir, 'dbx.config.ts'), 'utf-8');
        expect(config).toContain('fmt:');
        expect(config).toContain('oxc:');
        expect(config).toContain('semi: false');
        expect(config).toContain('lint:');
        expect(config).toContain('eqeqeq');
        expect(config).not.toContain('$schema');
        expect(fs.existsSync(path.join(dir, '.oxfmtrc.json'))).toBe(false);
        expect(fs.existsSync(path.join(dir, '.oxlintrc.json'))).toBe(false);
        expect(result.from).toBe('oxc');
        expect(result.to).toBe('toolchain');
    });

    it('accepts several --from values in the CLI', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');
        fs.writeFileSync(path.join(dir, '.prettierrc'), JSON.stringify({ semi: false }), 'utf-8');
        await migrateCommand().run(
            { from: ['biome', 'prettier'], write: true, ignoreManagedFiles: true },
            cliContext(dir)
        );
        expect(fs.existsSync(path.join(dir, '.oxfmtrc.json'))).toBe(true);
        expect(fs.existsSync(path.join(dir, '.oxlintrc.json'))).toBe(true);
    });
});

describe('produced files + --target vite', () => {
    it('renders a vite.config.ts without writing (renderViteTarget)', () => {
        const dir = makeTmp();
        const file = renderViteTarget(dir, { fmt: { semi: true } });
        expect(file.path).toBe(path.join(dir, 'vite.config.ts'));
        expect(file.content).toContain('semi: true');
        expect(fs.existsSync(file.path)).toBe(false);
    });

    it('biome --target vite folds fmt + lint into vite.config.ts', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');
        const result = await runMigration('biome', { cwd: dir, target: 'vite', write: true });
        const file = path.join(dir, 'vite.config.ts');
        expect(result.written).toEqual([file]);
        expect(result.files?.[0]?.path).toBe(file);
        const content = fs.readFileSync(file, 'utf-8');
        expect(content).toContain('fmt: {');
        expect(content).toContain('lint: {');
    });

    it('exposes file contents so --check can compare them', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');
        const dry = await runMigration('biome', { cwd: dir });
        expect(dry.files?.map(f => path.basename(f.path))).toEqual([
            '.oxfmtrc.json',
            '.oxlintrc.json',
        ]);
        expect(diffFiles(dry.files!).map(d => d.status)).toEqual(['missing', 'missing']);
        expect(hasPending(diffFiles(dry.files!))).toBe(true);

        await runMigration('biome', { cwd: dir, write: true });
        expect(diffFiles(dry.files!).map(d => d.status)).toEqual(['same', 'same']);
        expect(hasPending(diffFiles(dry.files!))).toBe(false);
    });
});

describe('diffFiles', () => {
    it('detects missing, changed and same', () => {
        const dir = makeTmp();
        const file = path.join(dir, 'x.json');
        expect(diffFiles([{ path: file, content: '{}\n' }])[0]?.status).toBe('missing');
        fs.writeFileSync(file, '{"a":1}\n', 'utf-8');
        expect(diffFiles([{ path: file, content: '{}\n' }])[0]?.status).toBe('changed');
        expect(diffFiles([{ path: file, content: '{"a":1}\n' }])[0]?.status).toBe('same');
    });
});

describe('eslint flat config', () => {
    it('points at --online for a JS/flat config', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'eslint.config.js'), 'export default [];', 'utf-8');
        const result = await runMigration('eslint', { cwd: dir });
        expect(result.notes?.join('\n')).toContain('--online');
        expect(result.files?.map(f => path.basename(f.path))).toEqual(['.oxlintrc.json']);
    });
});

const VITE_SAMPLE = `import { defineConfig } from 'vite-plus';

export default defineConfig({
    test: { include: ['src/**/*.test.ts'], environment: 'node' },
    fmt: { semi: true, singleQuote: true },
});
`;

describe('vite -> toolchain', () => {
    it('extracts the defineConfig object literal (balanced-paren aware)', () => {
        expect(extractViteObject(VITE_SAMPLE)).toEqual({
            text: "{\n    test: { include: ['src/**/*.test.ts'], environment: 'node' },\n    fmt: { semi: true, singleQuote: true },\n}",
        });
    });

    it('extracts a default-exported object when there is no defineConfig', () => {
        const source = 'export default {\n    fmt: { semi: false },\n};\n';
        expect(extractViteObject(source)).toEqual({ text: '{\n    fmt: { semi: false },\n}' });
    });

    it('flags non-literal configs (imports/plugins/helpers)', () => {
        expect(scanLiteralObject('{ fmt: { semi: true } }').ok).toBe(true);
        expect(scanLiteralObject('{ plugins: [react()] }')).toEqual({
            ok: false,
            reason: 'non-literal value `react`',
        });
        expect(scanLiteralObject('{ x: `a${b}` }').ok).toBe(false);
    });

    it('splices a `vite` key into an existing toolchain', () => {
        const base = `export default defineConfig({\n    toolchain: {\n        project: { name: 'acme' },\n    },\n});\n`;
        const folded = foldViteIntoConfig(base, '{ fmt: { semi: true } }');
        expect('content' in folded && folded.content).toContain('vite: { fmt: { semi: true } },');
        expect('content' in folded && folded.content).toContain("project: { name: 'acme' }");
    });

    it('deep-merges object literals (arrays/scalars replaced, objects combined)', () => {
        const merged = mergeViteObjects(
            '{ a: 1, list: [1, 2], nested: { x: true, y: false } }',
            '{ list: [3], nested: { y: true } }'
        );
        expect(merged).toContain('a: 1');
        expect(merged).toContain('list: [3]');
        expect(merged).toContain('x: true');
        expect(merged).toContain('y: true');
        expect(merged).not.toContain('y: false');
        expect(merged).not.toContain('[1, 2]');
    });

    it('deep-merges into an existing toolchain.vite and re-enables the managed shim', () => {
        const source = `export default defineConfig({\n    toolchain: {\n        vite: {\n            config: false,\n            fmt: { semi: false, singleQuote: true },\n            test: { environment: 'node' },\n        },\n    },\n});\n`;
        const folded = foldViteIntoConfig(
            source,
            '{\n    fmt: { semi: true },\n    build: { sourcemap: true },\n}'
        );
        const content = 'content' in folded ? folded.content : '';
        // Existing settings are kept, `fmt` is merged, `build` is added.
        expect(content).toContain("environment: 'node'");
        expect(content).toContain('singleQuote: true');
        expect(content).toContain('semi: true');
        expect(content).toContain('sourcemap: true');
        // The old opt-out is flipped so `dbx sync` writes the shim again.
        expect(content).not.toContain('config: false');
        expect(content).toContain('config: true');
        expect((content.match(/fmt:/g) ?? []).length).toBe(1);
    });

    it('adds `/vite.config.ts` to fmt.ignorePatterns', () => {
        expect(ensureViteFmtIgnore('{ fmt: { semi: true } }')).toBe(
            "{ fmt: { ignorePatterns: ['/vite.config.ts'], semi: true } }"
        );
        expect(ensureViteFmtIgnore("{ fmt: { ignorePatterns: ['dist/**'] } }")).toBe(
            "{ fmt: { ignorePatterns: ['/vite.config.ts', 'dist/**'] } }"
        );
        expect(ensureViteFmtIgnore('{ test: {} }')).toBe(
            "{ fmt: { ignorePatterns: ['/vite.config.ts'] }, test: {} }"
        );
        const once = ensureViteFmtIgnore('{ fmt: { semi: true } }');
        expect(ensureViteFmtIgnore(once)).toBe(once);
    });

    it('folds a hand-written vite.config.ts into dbx.config.ts', async () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'dbx.config.ts'),
            `import { defineConfig } from '@deltabox/toolchain';\n\nexport default defineConfig({\n    toolchain: {\n        project: { name: 'acme' },\n    },\n});\n`,
            'utf-8'
        );
        fs.writeFileSync(path.join(dir, 'vite.config.ts'), VITE_SAMPLE, 'utf-8');

        const result = await runMigration('vite', { cwd: dir, write: true });
        expect(result.from).toBe('vite');
        expect(result.written).toEqual([path.join(dir, 'dbx.config.ts')]);
        const content = fs.readFileSync(path.join(dir, 'dbx.config.ts'), 'utf-8');
        expect(content).toContain('vite: {');
        expect(content).toContain("environment: 'node'");
        expect(content).toContain('singleQuote: true');
        expect(content).toContain("project: { name: 'acme' }");
        expect(content).toContain("ignorePatterns: ['/vite.config.ts']");
    });

    it('creates a fresh `dbx.config.ts` with `defineConfig` when none exists', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'vite.config.ts'), VITE_SAMPLE, 'utf-8');
        const result = await runMigration('vite', { cwd: dir, write: true });
        const target = path.join(dir, 'dbx.config.ts');
        expect(result.written).toEqual([target]);
        const content = fs.readFileSync(target, 'utf-8');
        expect(content).toContain("import { defineConfig } from '@deltabox/toolchain';");
        expect(content).toContain('export default defineConfig({');
        expect(content).toContain('vite: {');
        expect(content).not.toContain('Generated by');
    });

    it('removes the folded vite.config.ts unless `ignoreViteConfigFile`', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'dbx.config.ts'), `export default { toolchain: {} };\n`);
        fs.writeFileSync(path.join(dir, 'vite.config.ts'), VITE_SAMPLE, 'utf-8');
        const result = await runMigration('vite', { cwd: dir, write: true });
        expect(result.removed).toEqual([path.join(dir, 'vite.config.ts')]);
        expect(fs.existsSync(path.join(dir, 'vite.config.ts'))).toBe(false);

        const keep = makeTmp();
        fs.writeFileSync(path.join(keep, 'dbx.config.ts'), `export default { toolchain: {} };\n`);
        fs.writeFileSync(path.join(keep, 'vite.config.ts'), VITE_SAMPLE, 'utf-8');
        await runMigration('vite', { cwd: keep, write: true, ignoreViteConfigFile: true });
        expect(fs.existsSync(path.join(keep, 'vite.config.ts'))).toBe(true);
    });

    it('changes nothing when the config is not foldable', async () => {
        const dir = makeTmp();
        const dbx = `export default defineConfig({\n    toolchain: {},\n});\n`;
        fs.writeFileSync(path.join(dir, 'dbx.config.ts'), dbx, 'utf-8');
        fs.writeFileSync(
            path.join(dir, 'vite.config.ts'),
            "import { defineConfig } from 'vite-plus';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });\n",
            'utf-8'
        );
        const result = await runMigration('vite', { cwd: dir, write: true });
        expect(result.written).toEqual([]);
        expect(result.unmapped?.length).toBe(1);
        expect(fs.readFileSync(path.join(dir, 'dbx.config.ts'), 'utf-8')).toBe(dbx);
    });

    it('skips a dbx-generated vite.config.ts shim', async () => {
        const dir = makeTmp();
        const dbx = `import { defineConfig } from '@deltabox/toolchain';\n\nexport default defineConfig({ toolchain: {} });\n`;
        const shim = [
            '// Generated by @deltabox/toolchain — edit the vite section in dbx.config and run `dbx sync`.',
            "import { resolveVite } from '@deltabox/toolchain/vite';",
            "import { defineConfig, type ViteUserConfig } from 'vite-plus';",
            '',
            'export default defineConfig(resolveVite<ViteUserConfig>({ cwd: import.meta.dirname }));',
            '',
        ].join('\n');
        fs.writeFileSync(path.join(dir, 'dbx.config.ts'), dbx, 'utf-8');
        fs.writeFileSync(path.join(dir, 'vite.config.ts'), shim, 'utf-8');

        // Not detected as a hand-written config, and `run` leaves it alone.
        expect(detectMigrations(dir).map(m => m.id)).not.toContain('vite-to-toolchain');
        const result = await runMigration('vite', { cwd: dir, write: true });
        expect(result.written).toEqual([]);
        expect(result.removed ?? []).toEqual([]);
        expect(fs.existsSync(path.join(dir, 'vite.config.ts'))).toBe(true);
        expect(fs.readFileSync(path.join(dir, 'dbx.config.ts'), 'utf-8')).toBe(dbx);
    });
});

/** A spy sync task that records the dirs it ran in. */
function spyTask(ran: string[]): SyncTask {
    return {
        name: 'spy',
        run: ctx => {
            ran.push(ctx.cwd);
            return [];
        },
    };
}

function cliContext(dir: string, syncTasks: SyncTask[] = []): ToolchainCommandContext {
    return { cwd: dir, projectType: 'project', config: {}, tokens: {}, syncTasks };
}

function migrateCommand() {
    const command = migrateCommands().find(c => c.name === 'migrate');
    if (!command) throw new Error('migrate command not found');
    return command;
}

describe('migrate CLI post-migration sync', () => {
    it('accepts repeated --from values', () => {
        const from = migrateCommand().options?.find(option => option.flags.includes('--from'));
        expect(from?.multiple).toBe(true);
    });

    it('regenerates managed files after --write', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');
        const ran: string[] = [];
        await migrateCommand().run({ from: 'biome', write: true }, cliContext(dir, [spyTask(ran)]));
        expect(ran).toEqual([dir]);
        expect(fs.existsSync(path.join(dir, '.oxfmtrc.json'))).toBe(true);
    });

    it('skips the sync with `ignoreManagedFiles`', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');
        const ran: string[] = [];
        await migrateCommand().run(
            { from: 'biome', write: true, ignoreManagedFiles: true },
            cliContext(dir, [spyTask(ran)])
        );
        expect(ran).toEqual([]);
    });

    it('does not sync on a dry run', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');
        const ran: string[] = [];
        await migrateCommand().run({ from: 'biome' }, cliContext(dir, [spyTask(ran)]));
        expect(ran).toEqual([]);
    });

    it('drops the changelog task with `ignoreChangelog`', async () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'biome.json'), JSON.stringify(BIOME), 'utf-8');
        const ran: string[] = [];
        const named = (name: string): SyncTask => ({
            name,
            run: () => {
                ran.push(name);
                return [];
            },
        });
        await migrateCommand().run(
            { from: 'biome', write: true, ignoreChangelog: true },
            cliContext(dir, [named('changelog'), named('other')])
        );
        expect(ran).toEqual(['other']);
    });
});
