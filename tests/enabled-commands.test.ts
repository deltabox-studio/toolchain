import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { ToolchainCommandContext } from '@deltabox/toolchain/shared';

import { enabledCommands } from '../src/cli/commands/enabled.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-enabled-'));
    dirs.push(dir);
    return dir;
}

function context(
    cwd: string,
    config: ToolchainCommandContext['config'] = {}
): ToolchainCommandContext {
    return {
        cwd,
        projectType: 'project',
        config,
        tokens: {},
    };
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('enabled CLI commands', () => {
    it('disables the workspace scope in .vscode/settings.json', async () => {
        const cwd = tmp();
        const command = enabledCommands().find(item => item.name === 'disable');
        expect(command).toBeDefined();
        await command!.run({ workspace: true, cwd }, context(cwd));

        const settings = JSON.parse(
            fs.readFileSync(path.join(cwd, '.vscode/settings.json'), 'utf8')
        ) as Record<string, unknown>;
        expect(settings['deltabox.toolchain.enabled']).toBe(false);
    });

    it('prints the resolved state from the config', async () => {
        const cwd = tmp();
        const command = enabledCommands().find(item => item.name === 'enabled');
        const raw: string[] = [];
        const original = process.stdout.write;
        // `logger.raw` writes to stdout; keep the test independent of colours.
        process.stdout.write = ((chunk: string | Uint8Array) => {
            raw.push(String(chunk));
            return true;
        }) as typeof process.stdout.write;
        try {
            await command!.run(
                { json: true },
                context(cwd, { enabled: { scope: 'workspace', disabled: true } })
            );
        } finally {
            process.stdout.write = original;
        }
        expect(raw.join('')).toContain('"enabled": false');
    });
});
