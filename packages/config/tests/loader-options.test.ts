import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import {
    createConfigFile,
    findConfigFile,
    findParentConfigFile,
    inferConfigFileType,
    loadConfig,
    loadConfigSync,
} from '../src/index.js';

const tempDirs: string[] = [];

function tempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-loader-'));
    tempDirs.push(dir);
    return dir;
}

function repoRoot(): string {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, '.git'));
    return dir;
}

afterEach(() => {
    while (tempDirs.length > 0) fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe('loadConfig tsconfig option', () => {
    function writeProject(cwd: string): void {
        fs.mkdirSync(path.join(cwd, 'src'), { recursive: true });
        fs.writeFileSync(path.join(cwd, 'src', 'answer.ts'), 'export const answer = 42;\n');
        // The nearest tsconfig knows nothing about the alias; the explicit
        // loader tsconfig does.
        fs.writeFileSync(path.join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }));
        fs.writeFileSync(
            path.join(cwd, 'tsconfig.lib.json'),
            JSON.stringify({
                compilerOptions: { baseUrl: '.', paths: { '@lib/*': ['src/*'] } },
            })
        );
        fs.writeFileSync(
            path.join(cwd, 'custom.ts'),
            "import { answer } from '@lib/answer.js';\nexport default { port: Number(answer) };\n"
        );
    }

    it('resolves tsconfig path aliases through the tsx fallback', async () => {
        const cwd = tempDir();
        writeProject(cwd);
        await expect(loadConfig({ cwd, names: ['custom.ts'] })).rejects.toThrow();
        const loaded = await loadConfig({
            cwd,
            names: ['custom.ts'],
            tsconfig: 'tsconfig.lib.json',
        });
        expect(loaded?.config).toEqual({ port: 42 });
    });

    it('accepts tsconfig through configFileOptions', async () => {
        const cwd = tempDir();
        writeProject(cwd);
        const loaded = await loadConfig({
            parser: z.object({ port: z.number() }),
            cwd,
            configFileOptions: { filename: 'custom', tsconfig: 'tsconfig.lib.json' },
        });
        expect(loaded?.config).toEqual({ port: 42 });
    });

    it('still rewrites relative .js -> .ts when tsconfig is disabled', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'answer.ts'), 'export const answer = 1;\n');
        fs.writeFileSync(
            path.join(cwd, 'custom.ts'),
            "import { answer } from './answer.js';\nexport default { port: answer };\n"
        );
        const loaded = await loadConfig({
            cwd,
            names: ['custom.ts'],
            tsconfig: false,
        });
        expect(loaded?.config).toEqual({ port: 1 });
    });
});

describe('ancestor discovery', () => {
    it('loads the nearest ancestor config with parent: true', async () => {
        const root = repoRoot();
        const child = path.join(root, 'packages', 'app');
        fs.mkdirSync(child, { recursive: true });
        fs.writeFileSync(path.join(root, 'dbx.config.json'), '{"port":1}');

        const loaded = await loadConfig({ cwd: child, names: ['dbx.config.json'], parent: true });
        expect(loaded?.config).toEqual({ port: 1 });
        expect(loaded?.path).toBe(path.join(root, 'dbx.config.json'));
    });

    it('finds the nearest parent config without loading it', () => {
        const root = repoRoot();
        const child = path.join(root, 'packages', 'app');
        fs.mkdirSync(child, { recursive: true });
        fs.writeFileSync(path.join(root, 'dbx.config.json'), '{}');
        expect(findParentConfigFile({ cwd: child, names: ['dbx.config.json'] })).toBe(
            path.join(root, 'dbx.config.json')
        );
        // A repo root never inherits from above itself.
        expect(findParentConfigFile({ cwd: root, names: ['dbx.config.json'] })).toBeUndefined();
    });

    it('does not walk past a repository boundary', async () => {
        const outer = repoRoot();
        fs.writeFileSync(path.join(outer, 'dbx.config.json'), '{"port":1}');
        const repo = path.join(outer, 'repo');
        const child = path.join(repo, 'app');
        fs.mkdirSync(child, { recursive: true });
        fs.mkdirSync(path.join(repo, '.git'));

        await expect(
            loadConfig({ cwd: child, names: ['dbx.config.json'], parent: true })
        ).resolves.toBeUndefined();
    });
});

describe('accept filter', () => {
    it('skips rejected files during discovery and loading', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'first.config.json'), '{"from":"first"}');
        fs.writeFileSync(path.join(cwd, 'second.config.json'), '{"from":"second"}');
        const names = ['first.config.json', 'second.config.json'];
        const accept = (file: string): boolean => file.endsWith('second.config.json');

        expect(findConfigFile({ cwd, names, accept })).toBe(path.join(cwd, 'second.config.json'));
        const loaded = await loadConfig({ cwd, names, accept });
        expect(loaded?.config).toEqual({ from: 'second' });
    });
});

describe('scaffold formats', () => {
    it('infers the format from the file name', () => {
        expect(inferConfigFileType('dbx.config.ts')).toBe('file');
        expect(inferConfigFileType('dbx.config.json')).toBe('json');
        expect(inferConfigFileType('dbx.config.yml')).toBe('yaml');
        expect(inferConfigFileType('.env.local')).toBe('env');
        expect(inferConfigFileType('setup.ps1')).toBe('cli');
    });

    it('writes an empty JSON config', () => {
        const cwd = tempDir();
        const file = createConfigFile({ cwd, name: 'dbx.config.json' });
        expect(JSON.parse(fs.readFileSync(file, 'utf-8'))).toEqual({});
    });

    it('serializes nested content to YAML', () => {
        const cwd = tempDir();
        const file = createConfigFile({
            cwd,
            name: 'dbx.config.yaml',
            content: { project: { name: 'myapp' }, tags: ['a', 'b'] },
        });
        const source = fs.readFileSync(file, 'utf-8');
        expect(source).toContain('project:');
        expect(source).toContain('name: "myapp"');
        expect(source).toContain('- "a"');
        expect(source).toContain('- "b"');
    });

    it('writes flat KEY=value lines for env files', () => {
        const cwd = tempDir();
        const file = createConfigFile({
            cwd,
            name: '.env.example',
            content: { APP_HOST: 'localhost', APP_PORT: 3000, APP_TAGS: ['a', 'b'] },
        });
        const lines = fs.readFileSync(file, 'utf-8').trim().split('\n');
        expect(lines).toEqual(['APP_HOST=localhost', 'APP_PORT=3000', 'APP_TAGS=a,b']);
    });

    it('writes CLI flag lines', () => {
        const cwd = tempDir();
        const file = createConfigFile({
            cwd,
            type: 'cli',
            name: 'flags.txt',
            content: { host: 'x', debug: true, tags: ['a', 'b'], off: false },
        });
        expect(fs.readFileSync(file, 'utf-8').trim().split('\n')).toEqual([
            '--host=x',
            '--debug',
            '--tags=a',
            '--tags=b',
        ]);
    });

    it('merges defaults under content and overrides over it', () => {
        const cwd = tempDir();
        const file = createConfigFile({
            cwd,
            content: { toolchain: { enabled: true, logger: { level: 'warn' } } },
            defaults: { toolchain: { logger: { color: true } } },
            overrides: { toolchain: { enabled: false } },
        });
        const source = fs.readFileSync(file, 'utf-8');
        expect(source).toContain('enabled: false');
        expect(source).toContain('color: true');
        expect(source).toContain('level: "warn"');
    });
});

describe('bug regressions (hunt #3)', () => {
    function writeJsonConfig(cwd: string, name: string, value: unknown): void {
        fs.writeFileSync(path.join(cwd, name), JSON.stringify(value));
    }

    it('preserves dots in configFileOptions.filename', async () => {
        const cwd = tempDir();
        writeJsonConfig(cwd, 'dbx.config.json', { from: 'file' });
        fs.writeFileSync(
            path.join(cwd, 'package.json'),
            JSON.stringify({ toolchain: { from: 'pkg' } })
        );

        const loaded = await loadConfig({
            cwd,
            configFileOptions: { filename: 'dbx.config', packageJson: { key: 'toolchain' } },
        });
        expect(loaded?.config).toEqual({ from: 'file' });

        const sync = loadConfigSync({
            cwd,
            configFileOptions: { filename: 'dbx.config' },
        });
        expect(sync?.config).toEqual({ from: 'file' });

        expect(findConfigFile({ cwd, configFileOptions: { filename: 'dbx.config' } })).toBe(
            path.join(cwd, 'dbx.config.json')
        );
    });

    it('strips a real extension but keeps a dotted base name', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'custom.config.ts'), 'export default { a: 1 };');
        const loaded = await loadConfig({
            cwd,
            configFileOptions: { filename: 'custom.config.ts' },
        });
        expect(loaded?.config).toEqual({ a: 1 });

        const dotted = tempDir();
        fs.writeFileSync(path.join(dotted, 'app.settings.json'), '{"a":2}');
        await expect(
            loadConfig({ cwd: dotted, configFileOptions: { filename: 'app.settings' } })
        ).resolves.toMatchObject({ config: { a: 2 } });
    });

    it('finds an ancestor config through modern configFileOptions', () => {
        const root = repoRoot();
        const child = path.join(root, 'a', 'b');
        fs.mkdirSync(child, { recursive: true });
        fs.writeFileSync(path.join(root, 'dbx.config.json'), '{}');
        expect(
            findParentConfigFile({ cwd: child, configFileOptions: { filename: 'dbx.config' } })
        ).toBe(path.join(root, 'dbx.config.json'));
    });

    it('normalizes allowedFileExtensions casing', async () => {
        const cwd = tempDir();
        // Config extensions must end up lowercase so Node/tsx can import them.
        fs.writeFileSync(path.join(cwd, 'custom.ts'), 'export default { a: 1 };');
        const loaded = await loadConfig({
            cwd,
            configFileOptions: { filename: 'custom', allowedFileExtensions: ['.TS'] },
        });
        expect(loaded?.config).toEqual({ a: 1 });
    });

    it('rejects a non-string tsconfig with a clear error', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.json'), '{}');
        await expect(
            loadConfig({ cwd, names: ['dbx.config.json'], tsconfig: true as never })
        ).rejects.toThrow(/Invalid `tsconfig` option/);
    });

    it('writes empty env/cli defaults', () => {
        const cwd = tempDir();
        expect(fs.readFileSync(createConfigFile({ cwd, name: '.env.example' }), 'utf-8')).toBe('');
        expect(fs.readFileSync(createConfigFile({ cwd, name: 'flags.ps1' }), 'utf-8')).toBe('');
    });

    it('quotes YAML keys that need it', () => {
        const cwd = tempDir();
        const source = fs.readFileSync(
            createConfigFile({
                cwd,
                name: 'x.yaml',
                content: { '#tag': 1, '-dash': 2, 'a: b': 3, 'lead ': 4, ok: 5 },
            }),
            'utf-8'
        );
        expect(source).toContain('"#tag": 1');
        expect(source).toContain('"-dash": 2');
        expect(source).toContain('"a: b": 3');
        expect(source).toContain('"lead ": 4');
        expect(source).toContain('ok: 5');
        expect(source).not.toContain('\n#tag:');
    });
});

describe('bug regressions (hunt #4)', () => {
    it('uses the default common locations for configFileOptions', async () => {
        const cwd = tempDir();
        fs.mkdirSync(path.join(cwd, 'config'), { recursive: true });
        fs.writeFileSync(path.join(cwd, 'config', 'dbx.config.json'), '{"at":"config"}');
        await expect(
            loadConfig({ cwd, configFileOptions: { filename: 'dbx.config' } })
        ).resolves.toMatchObject({ config: { at: 'config' } });

        const second = tempDir();
        fs.mkdirSync(path.join(second, 'configs'), { recursive: true });
        fs.writeFileSync(path.join(second, 'configs', 'dbx.config.json'), '{"at":"configs"}');
        await expect(
            loadConfig({ cwd: second, configFileOptions: { filename: 'dbx.config' } })
        ).resolves.toMatchObject({ config: { at: 'configs' } });
    });

    it('supports ? and [] and {} glob locations', async () => {
        const cwd = tempDir();
        fs.mkdirSync(path.join(cwd, 'config1'));
        fs.mkdirSync(path.join(cwd, 'configa'));
        fs.writeFileSync(path.join(cwd, 'config1', 'dbx.config.json'), '{"ok":true}');
        fs.writeFileSync(path.join(cwd, 'configa', 'dbx.config.json'), '{"ok":true}');

        for (const pattern of ['config?', 'config[0-9]', '{config1,configa}']) {
            const loaded = await loadConfig({
                cwd,
                configFileOptions: { filename: 'dbx.config', commonLocation: { path: pattern } },
            });
            expect(loaded?.config, pattern).toEqual({ ok: true });
        }
    });

    it('resolves function exports when parsing', async () => {
        const asyncDir = tempDir();
        fs.writeFileSync(path.join(asyncDir, 'fn.mjs'), 'export default () => ({ a: 1 });');
        await expect(
            loadConfig({
                cwd: asyncDir,
                names: ['fn.mjs'],
                schema: z.object({ a: z.number() }),
            })
        ).resolves.toMatchObject({ config: { a: 1 } });

        const syncDir = tempDir();
        fs.writeFileSync(path.join(syncDir, 'fn.cjs'), 'module.exports = () => ({ a: 3 });');
        expect(
            loadConfigSync({
                cwd: syncDir,
                names: ['fn.cjs'],
                schema: z.object({ a: z.number() }),
            })?.config
        ).toEqual({ a: 3 });
    });

    it('keeps a function export raw without a parser', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'fn.mjs'), 'export default () => ({ a: 1 });');
        const loaded = await loadConfig({ cwd, names: ['fn.mjs'] });
        expect(typeof loaded?.config).toBe('function');
    });

    it('rejects a promise-returning function synchronously', () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'fn.cjs'), 'module.exports = async () => ({ a: 4 });');
        expect(() =>
            loadConfigSync({
                cwd,
                names: ['fn.cjs'],
                schema: z.object({ a: z.number() }),
            })
        ).toThrow(/returned a promise/);
    });

    it('validates configFileOptions.filename', async () => {
        const cwd = tempDir();
        await expect(loadConfig({ cwd, configFileOptions: {} as never })).rejects.toThrow(
            /filename/
        );
        await expect(loadConfig({ cwd, configFileOptions: { filename: '   ' } })).rejects.toThrow(
            /filename/
        );
    });

    it('normalizes allowed extensions without a dot', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.json'), '{"a":1}');
        await expect(
            loadConfig({
                cwd,
                configFileOptions: { filename: 'dbx.config', allowedFileExtensions: ['json'] },
            })
        ).resolves.toMatchObject({ config: { a: 1 } });
    });

    it('guards scaffold line formats', () => {
        const cwd = tempDir();
        expect(() =>
            createConfigFile({ cwd, name: '.env.nl', content: { A: 'line1\nline2' } })
        ).toThrow(/line breaks/);
        const file = createConfigFile({
            cwd,
            type: 'cli',
            name: 'x.txt',
            content: { '--flag': 'v' },
        });
        expect(fs.readFileSync(file, 'utf-8')).toBe('--flag=v\n');
    });
});

describe('bug regressions (hunt #5)', () => {
    it('rejects a sync loader function returning a promise', () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.toml'), 'a = 1');
        expect(() =>
            loadConfigSync({
                cwd,
                names: ['dbx.config.toml'],
                loader: () => Promise.resolve({ a: 1 }),
            })
        ).toThrow(/loadConfigAsync/);
    });

    it('ignores prototype-chain package.json keys', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ toolchain: { a: 1 } }));
        for (const key of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
            await expect(
                loadConfig({
                    cwd,
                    configFileOptions: { filename: 'none', packageJson: { key } },
                })
            ).resolves.toBeUndefined();
        }
        await expect(
            loadConfig({
                cwd,
                configFileOptions: { filename: 'none', packageJson: { key: 'toolchain' } },
            })
        ).resolves.toMatchObject({ config: { a: 1 } });
    });

    it('preserves falsey default exports', async () => {
        const esm = tempDir();
        fs.writeFileSync(path.join(esm, 'null.mjs'), 'export default null;');
        fs.writeFileSync(path.join(esm, 'undef.mjs'), 'export default undefined;');
        expect((await loadConfig({ cwd: esm, names: ['null.mjs'] }))?.config).toBeNull();
        expect((await loadConfig({ cwd: esm, names: ['undef.mjs'] }))?.config).toBeUndefined();

        const cjs = tempDir();
        fs.writeFileSync(path.join(cjs, 'null.cjs'), 'module.exports = null;');
        fs.writeFileSync(path.join(cjs, 'undef.cjs'), 'module.exports = undefined;');
        expect(loadConfigSync({ cwd: cjs, names: ['null.cjs'] })?.config).toBeNull();
        expect(loadConfigSync({ cwd: cjs, names: ['undef.cjs'] })?.config).toBeUndefined();
    });

    it('supports [!...] glob negation', async () => {
        const cwd = tempDir();
        fs.mkdirSync(path.join(cwd, 'configa'));
        fs.mkdirSync(path.join(cwd, 'configb'));
        fs.writeFileSync(path.join(cwd, 'configa', 'dbx.config.json'), '{"which":"a"}');
        fs.writeFileSync(path.join(cwd, 'configb', 'dbx.config.json'), '{"which":"b"}');
        const loaded = await loadConfig({
            cwd,
            configFileOptions: {
                filename: 'dbx.config',
                commonLocation: { path: 'config[!a]' },
            },
        });
        expect(loaded?.config).toEqual({ which: 'b' });
    });

    it('rejects non-JSON scaffold content', () => {
        const cwd = tempDir();
        expect(() => createConfigFile({ cwd, content: { a: 1n } })).toThrow(/JSON-serializable/);
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        expect(() => createConfigFile({ cwd, content: circular })).toThrow(/circular/);
        expect(() => createConfigFile({ cwd, content: { m: new Map() } })).toThrow(
            /JSON-serializable/
        );
        expect(() => createConfigFile({ cwd, content: { n: Number.POSITIVE_INFINITY } })).toThrow(
            /non-finite/
        );
    });

    it('quotes YAML scalar-like keys', () => {
        const cwd = tempDir();
        const source = fs.readFileSync(
            createConfigFile({
                cwd,
                name: 'x.yaml',
                content: {
                    null: 1,
                    true: 2,
                    false: 3,
                    123: 4,
                    '~': 5,
                    yes: 6,
                    '2020-01-01': 7,
                    ok: 8,
                },
            }),
            'utf-8'
        );
        for (const key of ['null', 'true', 'false', '123', '~', 'yes', '2020-01-01']) {
            expect(source).toContain(`"${key}":`);
        }
        expect(source).toContain('ok: 8');
    });
});

describe('bug regressions (hunt #6)', () => {
    it('loads YAML configs through the installed parser', async () => {
        const cwd = tempDir();
        fs.writeFileSync(path.join(cwd, 'dbx.config.yaml'), 'port: 3000\n');
        expect(loadConfigSync({ cwd, names: ['dbx.config.yaml'] })?.config).toEqual({ port: 3000 });
        await expect(loadConfig({ cwd, names: ['dbx.config.yaml'] })).resolves.toMatchObject({
            config: { port: 3000 },
        });
    });

    it('parses YAML with a BOM, CRLF and anchors', () => {
        const cwd = tempDir();
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.yml'),
            '\uFEFFbase: &b\r\n  port: 1\r\ncopy: *b\r\n'
        );
        expect(loadConfigSync({ cwd, names: ['dbx.config.yml'] })?.config).toEqual({
            base: { port: 1 },
            copy: { port: 1 },
        });
    });

    it('quotes env values so dotenv reads them back', () => {
        const cwd = tempDir();
        const write = (content: Record<string, unknown>): string =>
            fs
                .readFileSync(
                    createConfigFile({ cwd, name: '.env.quote', content, overwrite: true }),
                    'utf-8'
                )
                .trim();
        expect(write({ A: '"foo"' })).toBe(`A='"foo"'`);
        expect(write({ A: 'foo #bar' })).toBe(`A='foo #bar'`);
        expect(write({ A: ' foo ' })).toBe(`A=' foo '`);
        expect(write({ A: 'a#b' })).toBe(`A='a#b'`);
        expect(write({ A: "a'b#c" })).toBe(`A="a'b#c"`);
    });

    it('rejects unsafe env/cli keys and unrepresentable values', () => {
        const cwd = tempDir();
        for (const key of ['A B', '#c', 'A=B']) {
            expect(() =>
                createConfigFile({ cwd, name: '.env.keys', content: { [key]: 1 } })
            ).toThrow(/Invalid env key/);
        }
        expect(() =>
            createConfigFile({ cwd, type: 'env', name: 'x.env', content: { A: `a'"#b` } })
        ).toThrow(/cannot be represented/);
        expect(() =>
            createConfigFile({ cwd, type: 'cli', name: 'x.txt', content: { 'a b': 1 } })
        ).toThrow(/Invalid CLI flag key/);
        expect(
            fs.readFileSync(
                createConfigFile({ cwd, type: 'cli', name: 'y.txt', content: { key: 'a b' } }),
                'utf-8'
            )
        ).toBe('--key="a b"\n');
    });

    it('validates scaffold options', () => {
        const cwd = tempDir();
        expect(() => createConfigFile({ cwd, defineConfigImport: '' })).toThrow(
            /defineConfigImport/
        );
        const jsonFile = createConfigFile({
            cwd,
            name: 'x.txt',
            type: 'JSON' as never,
            content: { a: 1 },
        });
        expect(JSON.parse(fs.readFileSync(jsonFile, 'utf-8'))).toEqual({ a: 1 });
        expect(() =>
            createConfigFile({ cwd, name: 'y.txt', type: 'toml' as never, content: { a: 1 } })
        ).toThrow(/Unknown config file type/);
    });
});
