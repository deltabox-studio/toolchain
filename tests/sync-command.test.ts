import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';

import { logger, type ToolchainCommandContext } from '@deltabox/toolchain/shared';

import { syncCommand } from '../src/cli/commands/sync.js';
import { watchCommand } from '../src/cli/commands/watch.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-sync-cli-'));
}

function context(cwd: string): ToolchainCommandContext {
    return { cwd, projectType: 'project', config: {}, tokens: {}, managed: false };
}

describe('sync command without a managed config', () => {
    const originalExitCode = process.exitCode;

    afterEach(() => {
        process.exitCode = originalExitCode;
        vi.restoreAllMocks();
    });

    it('fails --check and still emits a JSON envelope', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'package.json'), '{"name":"app"}\n');
        const raw = vi.spyOn(logger, 'raw').mockImplementation(() => {});
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        vi.spyOn(logger, 'warn').mockImplementation(() => {});

        await syncCommand().run?.({ check: true, json: true }, context(cwd));

        expect(process.exitCode).toBe(1);
        expect(raw).toHaveBeenCalledTimes(1);
        const printed = JSON.parse(raw.mock.calls[0]![0] as string) as {
            results: unknown[];
            upToDate: boolean;
        };
        expect(printed.results).toEqual([]);
        expect(printed.upToDate).toBe(false);
    });

    it('passes a check outside a project-shaped directory', async () => {
        const cwd = tmp();
        vi.spyOn(logger, 'raw').mockImplementation(() => {});
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

        await syncCommand().run?.({ check: true, json: true }, context(cwd));

        expect(process.exitCode).not.toBe(1);
        expect(warn).toHaveBeenCalled();
    });

    it('emits a JSON error envelope when the config failed to load', async () => {
        const cwd = tmp();
        const raw = vi.spyOn(logger, 'raw').mockImplementation(() => {});
        const error = vi.spyOn(logger, 'error').mockImplementation(() => {});

        await syncCommand().run?.(
            { json: true },
            { ...context(cwd), configError: 'cannot import dbx.config.ts' }
        );

        expect(process.exitCode).toBe(1);
        expect(error).not.toHaveBeenCalled();
        expect(raw).toHaveBeenCalledTimes(1);
        const printed = JSON.parse(raw.mock.calls[0]![0] as string) as {
            results: unknown[];
            upToDate: boolean;
            error: string;
        };
        expect(printed).toEqual({
            results: [],
            upToDate: false,
            error: 'cannot import dbx.config.ts',
        });
    });
});

describe('sync command flag combinations', () => {
    it('infers runtime option values on the returned command', () => {
        const command = syncCommand();
        type Args = Parameters<typeof command.run>[0];
        expectTypeOf<Args['check']>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<Args['recursive']>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<Args['only']>().toEqualTypeOf<string | undefined>();
    });

    it('derives config-backed format flags from the sync schema', () => {
        const flags = (syncCommand().options ?? []).map(option => option.flags);
        expect(flags).toEqual(
            expect.arrayContaining([
                '--no-format',
                '--no-format-fix',
                '--format-command <value>',
                '--format-exclude <value...>',
            ])
        );
        // Runtime-only flags stay explicit.
        expect(flags).toContain('--check');
        expect(flags).toContain('--recursive');
    });

    it('derives watch flags from the watch schema', () => {
        const flags = (watchCommand().options ?? []).map(option => option.flags);
        expect(flags).toEqual(
            expect.arrayContaining(['--debounce <value>', '--exclude <value...>', '--no-gitignore'])
        );
        expect(flags).toContain('--list');
    });

    it('rejects --recursive with --watch instead of ignoring --watch', async () => {
        const cwd = tmp();
        await expect(
            syncCommand().run?.({ recursive: true, watch: true }, context(cwd))
        ).rejects.toThrow(/--recursive.*--watch/);
    });
});
