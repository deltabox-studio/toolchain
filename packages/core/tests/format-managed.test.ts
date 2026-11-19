import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import type { SyncTask } from '@deltabox/toolchain/shared';

import {
    detectManagedFormatter,
    formatManagedFiles,
    managedFormatCommand,
    resolveManagedFormatting,
} from '../src/format-managed.js';
import { runSync } from '../src/sync.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-format-managed-'));
    dirs.push(dir);
    return dir;
}

function write(file: string, content: string): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf-8');
}

/** A tiny formatter script: prefixes each argument file with `// formatted`. */
function formatterScript(cwd: string): string {
    const file = path.join(cwd, 'fake-formatter.mjs');
    write(
        file,
        [
            "import fs from 'node:fs';",
            'for (const file of process.argv.slice(2)) {',
            "    fs.writeFileSync(file, `// formatted\\n${fs.readFileSync(file, 'utf-8')}`);",
            '}',
            '',
        ].join('\n')
    );
    return file;
}

function command(cwd: string): string {
    return `node ${formatterScript(cwd)} {files}`;
}

/**
 * A local `oxfmt` shim that records its argv and only formats the files it was
 * given (nothing when `--check` is present). Installed in `node_modules/.bin`
 * so the built-in formatter resolution picks it up on every platform.
 */
function fakeOxfmt(cwd: string): string {
    const script = [
        "import fs from 'node:fs';",
        "import path from 'node:path';",
        "import { fileURLToPath } from 'node:url';",
        'const args = process.argv.slice(2);',
        'const dir = path.dirname(fileURLToPath(import.meta.url));',
        "fs.writeFileSync(path.join(dir, 'args.json'), JSON.stringify(args));",
        "const check = args.includes('--check');",
        "for (const file of args.filter(arg => !arg.startsWith('-'))) {",
        '    if (check) continue;',
        "    const text = fs.readFileSync(file, 'utf-8');",
        '    fs.writeFileSync(file, `// formatted\\n${text}`);',
        '}',
        '',
    ].join('\n');
    const bin = path.join(cwd, 'node_modules', '.bin');
    write(path.join(bin, 'oxfmt.js'), script);
    write(path.join(bin, 'oxfmt'), `#!/usr/bin/env node\n${script}`);
    fs.chmodSync(path.join(bin, 'oxfmt'), 0o755);
    write(path.join(bin, 'oxfmt.cmd'), '@echo off\r\nnode "%~dp0oxfmt.js" %*\r\n');
    return path.join(bin, 'args.json');
}

describe('managed-file formatting', () => {
    it('is opt-in and honours the config', () => {
        expect(resolveManagedFormatting()).toEqual({ enabled: false, fix: true, exclude: [] });
        expect(resolveManagedFormatting({ config: { sync: { format: true } } })).toEqual({
            enabled: true,
            fix: true,
            exclude: [],
        });
        expect(resolveManagedFormatting({ config: { sync: { format: false } } })).toEqual({
            enabled: false,
            fix: true,
            exclude: [],
        });
        expect(
            resolveManagedFormatting({
                config: {
                    sync: { format: { enabled: true, fix: false, exclude: ['a.ts'] } },
                },
            })
        ).toMatchObject({ enabled: true, fix: false, exclude: ['a.ts'] });
    });

    it('detects the formatter from package.json and builds its command', () => {
        const cwd = tmp();
        write(
            path.join(cwd, 'package.json'),
            JSON.stringify({ devDependencies: { prettier: '^3' } })
        );
        expect(detectManagedFormatter(cwd)).toEqual({ tool: 'prettier', vitePlus: false });

        const formatter = detectManagedFormatter(cwd)!;
        expect(managedFormatCommand(cwd, formatter, true).args).toContain('--write');
        expect(managedFormatCommand(cwd, formatter, false).args).toContain('--check');
        expect(managedFormatCommand(cwd, formatter, true, ['a.ts']).args).toContain('a.ts');
        expect(managedFormatCommand(cwd, formatter, false, ['a.ts']).args).toEqual(
            expect.arrayContaining(['--check', 'a.ts'])
        );
    });

    it('passes only the managed, non-excluded files to a built-in formatter', async () => {
        const cwd = tmp();
        const argsFile = fakeOxfmt(cwd);
        write(path.join(cwd, 'a.ts'), 'a\n');
        write(path.join(cwd, 'b.ts'), 'b\n');
        write(path.join(cwd, 'unrelated.ts'), 'unrelated\n');

        const result = await formatManagedFiles(cwd, ['a.ts', 'b.ts'], {
            config: { fmt: { oxc: true }, sync: { format: { exclude: ['b.ts'] } } },
        });

        expect(result.ran).toBe(true);
        expect(JSON.parse(fs.readFileSync(argsFile, 'utf-8'))).toEqual(['a.ts']);
        expect(fs.readFileSync(path.join(cwd, 'a.ts'), 'utf-8')).toBe('// formatted\na\n');
        expect(fs.readFileSync(path.join(cwd, 'b.ts'), 'utf-8')).toBe('b\n');
        expect(fs.readFileSync(path.join(cwd, 'unrelated.ts'), 'utf-8')).toBe('unrelated\n');
    });

    it('runs a command override on the selected files and skips excluded ones', async () => {
        const cwd = tmp();
        write(path.join(cwd, 'a.ts'), 'a\n');
        write(path.join(cwd, 'b.ts'), 'b\n');
        const result = await formatManagedFiles(cwd, ['a.ts', 'b.ts'], {
            config: { sync: { format: { command: command(cwd), exclude: ['b.ts'] } } },
        });

        expect(result.ran).toBe(true);
        expect(result.code).toBe(0);
        expect(fs.readFileSync(path.join(cwd, 'a.ts'), 'utf-8')).toBe('// formatted\na\n');
        expect(fs.readFileSync(path.join(cwd, 'b.ts'), 'utf-8')).toBe('b\n');
    });

    it('formats managed files when enabled during runSync', async () => {
        const cwd = tmp();
        const task: SyncTask = { name: 'x', run: () => [{ path: 'a.ts', content: 'a\n' }] };
        const result = await runSync({
            tasks: [task],
            cwd,
            config: { sync: { format: { command: command(cwd) } } },
            tokens: {},
            quiet: true,
        });

        expect(result.written).toEqual(['a.ts']);
        expect(result.changed).toEqual(['a.ts']);
        expect(fs.readFileSync(path.join(cwd, 'a.ts'), 'utf-8')).toBe('// formatted\na\n');
    });

    it('leaves managed files unformatted by default', async () => {
        const cwd = tmp();
        const task: SyncTask = { name: 'x', run: () => [{ path: 'a.ts', content: 'a\n' }] };
        await runSync({ tasks: [task], cwd, config: {}, tokens: {}, quiet: true });
        expect(fs.readFileSync(path.join(cwd, 'a.ts'), 'utf-8')).toBe('a\n');
    });

    it('can disable formatting explicitly', async () => {
        const cwd = tmp();
        const task: SyncTask = { name: 'x', run: () => [{ path: 'a.ts', content: 'a\n' }] };
        await runSync({
            tasks: [task],
            cwd,
            config: { sync: { format: false } },
            tokens: {},
            quiet: true,
        });
        expect(fs.readFileSync(path.join(cwd, 'a.ts'), 'utf-8')).toBe('a\n');
    });

    it('restores the originals after a formatted --check run', async () => {
        const cwd = tmp();
        write(path.join(cwd, 'a.ts'), 'old\n');
        const task: SyncTask = { name: 'x', run: () => [{ path: 'a.ts', content: 'new\n' }] };
        const result = await runSync({
            tasks: [task],
            cwd,
            config: { sync: { format: { command: command(cwd) } } },
            tokens: {},
            check: true,
            quiet: true,
        });

        expect(result.upToDate).toBe(false);
        expect(result.changed).toEqual(['a.ts']);
        expect(fs.readFileSync(path.join(cwd, 'a.ts'), 'utf-8')).toBe('old\n');
    });

    it('formats a temporary copy during --check so formatting drift is detected', async () => {
        const cwd = tmp();
        const argsFile = fakeOxfmt(cwd);
        // The generated content already matches the file, but the formatter
        // would rewrite it: --check must still report drift.
        write(path.join(cwd, 'managed.ts'), 'new\n');
        write(path.join(cwd, 'unrelated.ts'), 'unrelated\n');
        const task: SyncTask = {
            name: 'x',
            run: () => [{ path: 'managed.ts', content: 'new\n' }],
        };

        const result = await runSync({
            tasks: [task],
            cwd,
            config: { fmt: { oxc: true }, sync: { format: true } },
            tokens: {},
            check: true,
            quiet: true,
        });

        expect(result.upToDate).toBe(false);
        expect(result.changed).toEqual(['managed.ts']);
        expect(fs.readFileSync(path.join(cwd, 'managed.ts'), 'utf-8')).toBe('new\n');
        expect(fs.readFileSync(path.join(cwd, 'unrelated.ts'), 'utf-8')).toBe('unrelated\n');
        const args = JSON.parse(fs.readFileSync(argsFile, 'utf-8')) as string[];
        // Fix mode (temporary write), never the formatter's own check mode.
        expect(args).toEqual(expect.arrayContaining(['managed.ts']));
        expect(args).not.toContain('--check');
        expect(args).not.toContain('unrelated.ts');
    });
});
