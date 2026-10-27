import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { SyncContext } from '@deltabox/toolchain-shared';

import { editorConfigSyncTask, toolingConfigTask } from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-editor-'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function context(cwd: string, config: SyncContext['config']): SyncContext {
    return {
        cwd,
        projectType: 'project',
        config,
        tokens: {},
        log: () => {},
        warn: () => {},
    };
}

describe('editorConfigSyncTask', () => {
    it('adds missing VS Code defaults without overriding existing settings', async () => {
        const cwd = makeTmp();
        fs.mkdirSync(path.join(cwd, '.vscode'));
        fs.writeFileSync(
            path.join(cwd, '.vscode/settings.json'),
            JSON.stringify(
                {
                    'editor.defaultFormatter': 'esbenp.prettier-vscode',
                    'editor.codeActionsOnSave': { 'source.fixAll.eslint': 'explicit' },
                },
                null,
                4
            )
        );

        const files = await editorConfigSyncTask().run(
            context(cwd, {
                fmt: { oxc: {}, vscode: true },
                lint: { oxc: {}, vscode: true },
            })
        );
        expect(files).toEqual([]);
        const settings = JSON.parse(
            fs.readFileSync(path.join(cwd, '.vscode/settings.json'), 'utf-8')
        );
        expect(settings['editor.defaultFormatter']).toBe('esbenp.prettier-vscode');
        expect(settings['[typescript]']['editor.defaultFormatter']).toBe('oxc.oxc-vscode');
        expect(settings['editor.codeActionsOnSave']).toEqual({
            'source.fixAll.eslint': 'explicit',
            'source.fixAll.oxc': 'explicit',
        });
    });

    it('creates .vscode/settings.json when enabled and absent', async () => {
        const cwd = makeTmp();
        await editorConfigSyncTask().run(context(cwd, { fmt: { biome: {}, vscode: true } }));
        const settings = JSON.parse(
            fs.readFileSync(path.join(cwd, '.vscode/settings.json'), 'utf-8')
        );
        expect(settings['editor.defaultFormatter']).toBe('biomejs.biome');
    });
});

describe('toolingConfigTask', () => {
    it('warns when multiple formatters/linters are configured', async () => {
        const warnings: { message: string; id?: string }[] = [];
        const ctx = {
            ...context(makeTmp(), {
                fmt: { oxc: {}, biome: {} },
                lint: { oxc: {}, eslint: {} },
            }),
            warn: (message: string, id?: string) => warnings.push({ message, id }),
        };
        await toolingConfigTask().run(ctx);
        expect(warnings.map(warning => warning.id)).toEqual(['fmt.multiple', 'lint.multiple']);
        expect(warnings[0]?.message).toContain('oxc, biome');
        expect(warnings[1]?.message).toContain('oxc, eslint');
    });
});
