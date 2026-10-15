/**
 * `dbx()` — run `@deltabox/toolchain` from inside the Vite / Vite+ pipeline, so
 * consumers who only use Vite+ can still drive dbx.
 *
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite-plus';
 * import { defineDbxConfig } from '@deltabox/toolchain/vite';
 *
 * export default defineConfig(defineDbxConfig({ server: {}, build: {} }));
 * ```
 *
 * The plugin runs `dbx sync` before the dev server / build (or `dbx sync --check`
 * in CI) and re-syncs when a dbx input file changes in watch mode. Vite+ reads
 * `run.tasks` from the **static** config (a plugin's `config` hook is ignored),
 * so {@link defineDbxConfig} is what registers `vp run dbx:sync` / `dbx:check`.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, PluginOption, UserConfig } from 'vite';

import { spawnCross } from '@deltabox/toolchain-shared';

import { which } from './vp.js';

const IS_WINDOWS = process.platform === 'win32';

/** How a `dbx` binary was resolved. */
export type DbxSource = 'local' | 'global' | 'npx';

/** A resolved `dbx` invocation. */
export interface ResolvedDbx {
    /** The executable to spawn. */
    exe: string;
    /** Leading args (eg. `--yes @deltabox/toolchain` for the npx fallback). */
    args: string[];
    /** Where the binary came from. */
    source: DbxSource;
}

/** The `.bin/dbx` shim candidates inside a project (Windows variants first). */
function localCandidates(cwd: string): string[] {
    const base = path.join(cwd, 'node_modules', '.bin', 'dbx');
    return IS_WINDOWS ? [`${base}.cmd`, `${base}.exe`, `${base}.ps1`, base] : [base];
}

/**
 * Resolve the `dbx` binary: project-local shim -> global `PATH` ->
 * `npx --yes @deltabox/toolchain`.
 */
export function resolveDbx(cwd: string = process.cwd()): ResolvedDbx {
    for (const candidate of localCandidates(cwd)) {
        if (fs.existsSync(candidate)) return { exe: candidate, args: [], source: 'local' };
    }
    const global = which('dbx');
    if (global) return { exe: global, args: [], source: 'global' };
    return {
        exe: IS_WINDOWS ? 'npx.cmd' : 'npx',
        args: ['--yes', '@deltabox/toolchain'],
        source: 'npx',
    };
}

/** Run `dbx <args>` in `cwd`, streaming output. Resolves with the exit code. */
export function runDbx(args: string[], cwd: string = process.cwd()): Promise<number> {
    const resolved = resolveDbx(cwd);
    return new Promise<number>(resolve => {
        const child = spawnCross(resolved.exe, [...resolved.args, ...args], {
            cwd,
            env: process.env,
            stdio: 'inherit',
        });
        child.on('error', () => resolve(1));
        child.on('exit', code => resolve(code ?? 0));
    });
}

/** The Vite+ tasks the wrapper registers, keyed by task name. */
export const DBX_TASKS = {
    'dbx:sync': { command: 'dbx sync' },
    'dbx:check': { command: 'dbx sync --check' },
} as const;

export interface DbxPluginOptions {
    /** Project root (default: the resolved Vite root). */
    cwd?: string;
    /** Run `dbx sync` before the dev server / build (default true). */
    sync?: boolean;
    /**
     * Run `dbx sync --check` and fail the build when generated files are out of
     * date (default: true when `CI` is set in the environment).
     */
    check?: boolean;
    /** Re-sync when a dbx input file changes in watch mode (default true). */
    watch?: boolean;
    /** Debounce (ms) for watch-triggered syncs (default 150). */
    debounce?: number;
}

/** dbx input files whose change should trigger a re-sync in watch mode. */
const WATCH_INPUTS = [/dbx\.config\.[cm]?[jt]s$/, /tsconfig\.(?:default|monorepo)\.json$/];

/**
 * A Vite / Vite+ plugin that runs `@deltabox/toolchain` in the Vite pipeline:
 * `dbx sync` before dev/build (or `dbx sync --check` in CI) and a debounced
 * re-sync when a dbx input changes. Add it to `plugins`, or use
 * {@link defineDbxConfig}, which also registers the `vp run dbx:*` tasks.
 */
export function dbx(options: DbxPluginOptions = {}): Plugin {
    const check = options.check ?? Boolean(process.env.CI);
    const sync = options.sync ?? true;
    const watch = options.watch ?? true;
    const debounce = options.debounce ?? 150;

    let root = options.cwd ?? process.cwd();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let busy = false;

    const syncNow = async (): Promise<void> => {
        if (busy) return;
        busy = true;
        try {
            await runDbx(['sync'], root);
        } finally {
            busy = false;
        }
    };

    const schedule = (): void => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            void syncNow();
        }, debounce);
    };

    return {
        name: 'deltabox-toolchain',
        enforce: 'pre',
        configResolved(config) {
            root = options.cwd ?? config.root;
        },
        async buildStart() {
            if (check) {
                const code = await runDbx(['sync', '--check'], root);
                if (code !== 0) {
                    this.error(
                        'deltabox-toolchain: generated files are out of date — run `dbx sync`.'
                    );
                }
                return;
            }
            if (sync) await syncNow();
        },
        watchChange(id) {
            if (!watch || !sync) return;
            if (WATCH_INPUTS.some(pattern => pattern.test(id))) schedule();
        },
    };
}

/** A Vite+ config: Vite's `UserConfig` plus the Vite+ `run` block. */
export type DbxViteConfig = UserConfig & {
    run?: { tasks?: Record<string, unknown> } & Record<string, unknown>;
};

/**
 * Wrap a Vite+ config with dbx: prepend the {@link dbx} plugin and register the
 * `dbx:sync` / `dbx:check` tasks.
 */
export function defineDbxConfig(
    config: DbxViteConfig,
    options: DbxPluginOptions = {}
): DbxViteConfig {
    const existing: PluginOption[] = config.plugins ?? [];
    const run = config.run ?? {};
    return {
        ...config,
        plugins: [dbx(options), ...existing],
        run: { ...run, tasks: { ...DBX_TASKS, ...run.tasks } },
    };
}
