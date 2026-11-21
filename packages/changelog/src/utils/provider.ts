import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** The provider ids the built-in pipeline understands. */
const BUILTIN_PROVIDERS = new Set(['default', 'changesets']);

/**
 * Reject an unknown or malformed provider. A typo must not silently fall back
 * to the built-in provider, because the run would then write changelog/version
 * output the consumer expected another tool to own.
 */
export function assertKnownProvider(provider: unknown): void {
    if (Array.isArray(provider)) {
        throw new Error(
            'changelog provider: a plain array is ambiguous; use a single provider or ' +
                'scoped entries with `{ target, options }`.'
        );
    }
    if (typeof provider === 'string' && !BUILTIN_PROVIDERS.has(provider)) {
        throw new Error(
            `Unknown changelog provider "${provider}" ` +
                '(use "default", "changesets", a `{ id, run }` object, or a callback).'
        );
    }
    if (
        provider &&
        typeof provider === 'object' &&
        typeof (provider as { run?: unknown }).run !== 'function'
    ) {
        throw new Error('changelog provider: a provider object must define a `run(ctx)` function.');
    }
}

/** The command that runs the changesets version step. */
export function changesetsCommand(env: NodeJS.ProcessEnv = process.env): {
    command: string;
    args: string[];
    shell: boolean;
} {
    const bin = env.DBX_CHANGESET_BIN?.trim();
    if (!bin) {
        return {
            command: 'npx',
            args: ['--yes', '@changesets/cli', 'version'],
            shell: process.platform === 'win32',
        };
    }
    // A JS entrypoint is run through Node so the override works on Windows and
    // POSIX (the same convention as `DBX_GH_BIN`). Otherwise the command is run
    // directly.
    if (/\.[cm]?js$/i.test(bin)) {
        return { command: process.execPath, args: [bin, 'version'], shell: false };
    }
    return { command: bin, args: ['version'], shell: process.platform === 'win32' };
}

/** Fail early with a setup hint when changesets was not initialized. */
export function assertChangesetsSetup(root: string): void {
    const config = resolve(root, '.changeset', 'config.json');
    if (!existsSync(config)) {
        throw new Error(
            'changesets provider: no `.changeset/config.json` found; ' +
                'run `npx @changesets/cli init` and commit the `.changeset` directory first.'
        );
    }
}

/** Run `changeset version` in the repository (changesets owns the writes). */
export function runChangesetsVersion(root: string): void {
    assertChangesetsSetup(root);
    const { command, args, shell } = changesetsCommand();
    const result = spawnSync(command, args, {
        cwd: root,
        stdio: 'inherit',
        shell,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`changesets provider failed (exit code ${result.status ?? 'unknown'}).`);
    }
}
