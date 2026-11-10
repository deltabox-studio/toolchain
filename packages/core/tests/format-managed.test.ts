import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { SyncTask } from '@deltabox/toolchain/shared';
import { describe, expect, it } from 'vite-plus/test';

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
});
