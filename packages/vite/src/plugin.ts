/**
 * `dbx()` — run `@deltabox/toolchain` from inside the Vite / Vite+ pipeline, so
 * consumers who only use Vite+ can still drive dbx.
 *
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite-plus';
 * import { dbx, DBX_TASKS } from 'vite-plugin-dbx';
 *
 * export default defineConfig({
 *     plugins: [dbx()],
 *     run: { tasks: { ...DBX_TASKS } },
 * });
 * ```
 *
 * The plugin runs `dbx sync` before the dev server / build (or `dbx sync --check`
 * in CI) and re-syncs when a dbx input file changes in watch mode. Vite+ reads
 * `run.tasks` from the **static** config (a plugin's `config` hook is ignored),
 * so spread {@link DBX_TASKS} into `run.tasks` to expose `vp run dbx:sync` /
 * `dbx:check`.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, ViteUserConfig } from 'vite-plus';

import {
    loadToolchainConfig,
    mergePluginLayer,
    resolveFmtCustomGroups,
} from '@deltabox/toolchain/core';
import {
    applyFmtCustomGroups,
    applyReplacementsDeep,
    assertWorkspaceEnabledScope,
    DBX_PLUGIN_NAME,
    DBX_PLUGIN_SYMBOL,
    type DbxPluginDescriptor,
    type DbxPluginToolchain,
    deepMerge,
    findOwnCliEntry,
    isPlainObject,
    localToolchainVersion,
    logger,
    resolveOxcFmtConfig,
    resolveOxcLintConfig,
    resolveTokens,
    sectionConfig,
    sectionEnabled,
    spawnCross,
    TOOLCHAIN_PACKAGE,
    type ToolchainConfig,
    type ToolchainLogger,
    type ToolchainOxfmtConfig,
    type ToolchainViteConfig,
} from '@deltabox/toolchain/shared';

import { viteConfigObject } from './sync.js';
import { declaresVitePlus, which } from './vp.js';

const IS_WINDOWS = process.platform === 'win32';

/** Whether the "no project-local toolchain" npx-fallback warning was emitted. */
let warnedNpxFallback = false;

/** Whether the invalid-`DBX_BIN` warning was emitted. */
let warnedBadDbxBin = false;

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
 * Resolve the `dbx` binary, always preferring the project's own over a global
 * install: `DBX_BIN` override -> project-local shim -> the repo's own
 * `@deltabox/toolchain` bin -> (only for a project that pins nothing) global
 * `PATH` -> `npx` of the pinned version.
 *
 * A project-local binary is what the project pins, so a stale global `dbx` can
 * never be used by accident: when the project pins the toolchain but has no
 * resolvable local binary, the global install is skipped (with a warning) in
 * favour of `npx @deltabox/toolchain@<pinned>` — a stale global would otherwise
 * write older-format files and silently revert the project's generated ones.
 */
export function resolveDbx(cwd: string = process.cwd()): ResolvedDbx {
    const override = process.env.DBX_BIN;
    if (override) {
        if (fs.existsSync(override)) return { exe: override, args: [], source: 'local' };
        // A missing/typo'd DBX_BIN must not wedge every `dbx` call: warn once and
        // fall through to the normal resolution.
        if (!warnedBadDbxBin) {
            warnedBadDbxBin = true;
            logger.warn(`DBX_BIN points at ${override}, which does not exist; ignoring it.`);
        }
    }
    for (const candidate of localCandidates(cwd)) {
        if (fs.existsSync(candidate)) return { exe: candidate, args: [], source: 'local' };
    }
    const own = findOwnCliEntry(cwd);
    if (own) return { exe: process.execPath, args: [own], source: 'local' };

    const expected = localToolchainVersion(cwd);
    const global = which('dbx');
    if (global) {
        if (expected === undefined) return { exe: global, args: [], source: 'global' };
        logger.warn(
            `ignoring the global \`dbx\` at ${global} — this project pins ${TOOLCHAIN_PACKAGE}@${expected}.`
        );
    }
    const spec = expected ? `${TOOLCHAIN_PACKAGE}@${expected}` : TOOLCHAIN_PACKAGE;
    if (!warnedNpxFallback) {
        warnedNpxFallback = true;
        logger.warn(
            `no project-local ${TOOLCHAIN_PACKAGE} found — running \`npx --yes ${spec}\` (needs network).`
        );
    }
    return { exe: IS_WINDOWS ? 'npx.cmd' : 'npx', args: ['--yes', spec], source: 'npx' };
}

/**
 * Default deadline for a one-shot `dbx` call (`sync`/`--check`): a stalled run
 * is killed rather than left hanging. Long-running work streams its own output,
 * so this only bounds the plugin's own sync.
 */
export const DBX_TIMEOUT_MS = 5 * 60 * 1000;

/** Run `dbx <args>` in `cwd`, streaming output. Resolves with the exit code. */
export function runDbx(
    args: string[],
    cwd: string = process.cwd(),
    timeoutMs: number = DBX_TIMEOUT_MS
): Promise<number> {
    const resolved = resolveDbx(cwd);
    return new Promise<number>(resolve => {
        const child = spawnCross(resolved.exe, [...resolved.args, ...args], {
            cwd,
            env: process.env,
            stdio: 'inherit',
            ...(timeoutMs > 0 ? { timeoutMs } : {}),
        });
        child.on('error', () => resolve(1));
        child.on('exit', code => resolve(code ?? 0));
    });
}

/**
 * Wrap a one-shot run so a request that arrives while it is in flight triggers
 * exactly one more run when the current one finishes. Used by the plugin's
 * debounced watch sync: dropping such a request would leave the generated files
 * stale until the next change.
 */
export function createSerializedRunner(run: () => Promise<number>): () => Promise<number> {
    let busy = false;
    let pending = false;
    return async () => {
        if (busy) {
            pending = true;
            return 0;
        }
        busy = true;
        let code = 0;
        try {
            do {
                pending = false;
                code = await run();
            } while (pending);
        } finally {
            busy = false;
        }
        return code;
    };
}

/** Quote a value for a shell command line when it needs it. */
function shellPart(value: string): string {
    return /[\s"'&|<>^()]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

/**
 * The shell command Vite Task runs for a `dbx` subcommand. Vite Task runs the
 * `command` string through a shell, so instead of relying on `dbx` being on
 * `PATH` (an env-dependent lookup that can miss or pick a stale global) the
 * command is built from {@link resolveDbx} — the project's own binary, or the
 * pinned `npx` fallback — resolved when the config loads. `resolveDbx` warns
 * when it has to fall back, so a missing environment is visible rather than
 * silent.
 */
export function dbxTaskCommand(subcommand: string, cwd: string = process.cwd()): string {
    const resolved = resolveDbx(cwd);
    return [...[resolved.exe, ...resolved.args].map(shellPart), subcommand].join(' ');
}

/** The Vite+ tasks the wrapper registers, keyed by task name. */
export interface DbxTask {
    /** The shell command Vite Task runs. */
    command: string;
}

/**
 * The Vite+ tasks the wrapper registers, keyed by task name. The `command`s are
 * computed **lazily** (as getters): spreading `{ ...DBX_TASKS }` into
 * `run.tasks` still resolves them at config-load time, but merely importing
 * `vite-plugin-dbx` no longer runs {@link resolveDbx} (which would warn
 * about `dbx` resolution for consumers that never use these tasks).
 */
export const DBX_TASKS: Record<'dbx:sync' | 'dbx:check', DbxTask> = {
    get 'dbx:sync'(): DbxTask {
        return { command: dbxTaskCommand('sync') };
    },
    get 'dbx:check'(): DbxTask {
        return { command: dbxTaskCommand('sync --check') };
    },
};

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
    /**
     * The toolchain config carried inline. This is what makes a `dbx.config.*`
     * optional in plugin mode. The `vite` section is deliberately omitted: the
     * Vite config is the user config here, so the plugin never tries to own it.
     */
    toolchain?: DbxPluginToolchain;
}

/** dbx input files whose change should trigger a re-sync in watch mode. */
const WATCH_INPUTS = [
    /dbx\.config\.[cm]?[jt]s$/,
    /vite\.config\.[cm]?[jt]s$/,
    /tsconfig\.(?:default|workspaces|monorepo)\.json$/,
];

/** A Vite log level for a dbx logger level (`success` -> `info`). */
function viteLogLevel(level: string | undefined): 'info' | 'warn' | 'error' | 'silent' | undefined {
    if (level === 'debug' || level === 'success' || level === 'info') return 'info';
    if (level === 'warn' || level === 'error' || level === 'silent') return level;
    return undefined;
}

/** Adapt a custom {@link ToolchainLogger} to Vite's `Logger`. */
function viteLogger(custom: ToolchainLogger) {
    return {
        hasWarned: false,
        info: (message: string) => custom.info(message),
        warn: (message: string) => custom.warn(message),
        warnOnce: (message: string) => custom.warn(message),
        error: (message: string) => custom.error(message),
        clearScreen: () => {},
        hasErrorLogged: () => false,
        hasInfo: () => true,
        hasWarn: () => true,
        hasError: () => true,
        debug: (message: string) => custom.debug(message),
    };
}

/**
 * The Vite config derived from the dbx sections via plugin lifecycles:
 * `logger` -> `logLevel`/`customLogger`, `watch` -> `server.watch`, and (only on
 * Vite+) `fmt`/`lint` -> the Vite+ formatter/linter. Pure Vite gets just the
 * standard options; nothing Vite+ specific is required.
 */
async function pluginViteConfig(
    toolchain: ToolchainConfig,
    userConfig: Record<string, unknown>,
    root: string
): Promise<ViteUserConfig | undefined> {
    const out: Record<string, unknown> = {};

    const loggerSetting = sectionEnabled(toolchain.logger)
        ? sectionConfig(toolchain.logger)
        : undefined;
    if (loggerSetting) {
        const level = viteLogLevel(loggerSetting.level);
        if (level) out.logLevel = level;
        if (loggerSetting.logger) out.customLogger = viteLogger(loggerSetting.logger);
    }

    const watchSetting = sectionEnabled(toolchain.watch)
        ? sectionConfig(toolchain.watch)
        : undefined;
    if (watchSetting?.exclude !== undefined) {
        const server = isPlainObject(userConfig.server) ? userConfig.server : {};
        const existing = isPlainObject(server.watch) ? server.watch : {};
        out.server = { ...server, watch: { ...existing, ignored: watchSetting.exclude } };
    }

    // Only a project that actually uses Vite+ gets its fmt/lint keys; pure Vite
    // must not receive unknown options just because a global `vp` exists.
    if (declaresVitePlus(root)) {
        // A bare `fmt: true` / `lint: true` means "use the defaults"; the Oxc
        // resolver only returns an object for an explicit `oxc` options object.
        const fmt =
            resolveOxcFmtConfig(toolchain) ?? (sectionEnabled(toolchain.fmt) ? true : undefined);
        const lint =
            resolveOxcLintConfig(toolchain) ?? (sectionEnabled(toolchain.lint) ? true : undefined);
        const derived = viteConfigObject({
            fmt,
            lint,
        } as ToolchainViteConfig) as { fmt?: unknown; lint?: unknown };
        for (const key of ['fmt', 'lint'] as const) {
            const value = derived[key];
            if (value === undefined) continue;
            const existing = userConfig[key];
            out[key] =
                isPlainObject(existing) && isPlainObject(value)
                    ? deepMerge(existing, value)
                    : value;
        }
        if (isPlainObject(out.fmt)) {
            const customGroups = await resolveFmtCustomGroups({ cwd: root });
            out.fmt = applyFmtCustomGroups(out.fmt as ToolchainOxfmtConfig, customGroups);
        }
    }

    return Object.keys(out).length > 0
        ? (applyReplacementsDeep(out, resolveTokens(toolchain)) as ViteUserConfig)
        : undefined;
}

/**
 * A Vite / Vite+ plugin that runs `@deltabox/toolchain` in the Vite pipeline:
 * carries the config inline, derives the Vite options from the dbx sections,
 * runs `dbx sync` before dev/build (or `dbx sync --check` in CI) and re-syncs
 * when a dbx input changes. Add it to `plugins`; spread {@link DBX_TASKS} into
 * `run.tasks` for the `vp run dbx:*` tasks.
 */
export function dbx(options: DbxPluginOptions = {}): Plugin {
    const check = options.check ?? Boolean(process.env.CI);
    const sync = options.sync ?? true;
    const watch = options.watch ?? true;
    const debounce = options.debounce ?? 150;
    const inline = options.toolchain ?? {};
    assertWorkspaceEnabledScope(inline as ToolchainConfig, 'vite plugin');
    const hasInline = Object.keys(inline).length > 0;

    const descriptor: DbxPluginDescriptor = {
        toolchain: inline,
        ...(options.cwd ? { cwd: options.cwd } : {}),
        sync,
        check,
        watch,
        debounce,
    };

    let root = options.cwd ?? process.cwd();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const syncNow = createSerializedRunner(() => runDbx(['sync'], root));

    const schedule = (): void => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            void syncNow().then(code => {
                if (code !== 0) logger.warn('dbx sync failed; continuing with stale files.');
            });
        }, debounce);
    };

    const plugin: Plugin = {
        name: DBX_PLUGIN_NAME,
        enforce: 'pre',
        async config(userConfig) {
            let toolchain: ToolchainConfig = inline as ToolchainConfig;
            try {
                const loaded = await loadToolchainConfig(root, {
                    tolerant: true,
                    skipHooks: true,
                    skipPluginProbe: true,
                });
                toolchain = hasInline
                    ? mergePluginLayer(loaded.config, inline as ToolchainConfig)
                    : loaded.config;
            } catch {
                // Keep the inline config when no dbx.config can be loaded.
            }
            return pluginViteConfig(toolchain, userConfig as Record<string, unknown>, root);
        },
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
            if (sync) {
                const code = await syncNow();
                if (code !== 0) {
                    this.error('deltabox-toolchain: `dbx sync` failed; generated files are stale.');
                }
            }
        },
        watchChange(id) {
            if (!watch || !sync) return;
            if (WATCH_INPUTS.some(pattern => pattern.test(id))) schedule();
        },
    };

    // Mark the plugin so the config loader can recover the inline options.
    Object.defineProperty(plugin, DBX_PLUGIN_SYMBOL, {
        value: descriptor,
        enumerable: false,
    });
    return plugin;
}
