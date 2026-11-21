import { createRequire } from 'node:module';

import type { ViteUserConfig } from 'vite-plus';
import type { PackUserConfig } from 'vite-plus/pack';

import { baseTsdownConfig } from '../packages/pack/src/config/node.js';
import { workspacePackageAliases } from '../packages/pack/src/config/workspace.js';

/** The workspace package's shared source alias preset. */
export const ALL_WORKSPACES = [/^@deltabox\/toolchain[-\/]/];
export const SHARED_ONLY = [/^@deltabox\/toolchain[-\/]shared/];

type WorkspaceTasks = NonNullable<NonNullable<ViteUserConfig['run']>['tasks']>;

const require = createRequire(import.meta.url);

/**
 * Load the `dbx()` dogfood plugin lazily.
 *
 * The workspace package resolves through its `exports` field (`dist/index.js`),
 * which does not exist yet on a clean checkout: `vp run` loads every package
 * config before building anything. Config loading must not fail at that point.
 * The explicit `pack`/`run` options below keep the build deterministic when the
 * plugin is unavailable; once the package is built, the plugin is used again.
 */
export function resolveDbxPlugin(): typeof import('vite-plugin-dbx').dbx | undefined {
    try {
        return (require('vite-plugin-dbx') as typeof import('vite-plugin-dbx')).dbx;
    } catch {
        return undefined;
    }
}

/** The standard workspace task set (build goes through `vp pack`). */
export function workspaceTasks(): WorkspaceTasks {
    return {
        build: {
            command: 'vp pack',
            cache: {
                input: [{ auto: true }, '!dist/**', '!**/*.tsbuildinfo'],
                output: ['dist/**'],
            },
        },
        typecheck: {
            command: 'tsc -p tsconfig.json --noEmit',
            cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
        },
        test: {
            command: 'vp test run',
            cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
        },
        fmt: { command: 'vp fmt', cache: { input: [{ auto: true }], output: [] } },
        'fmt:check': {
            command: 'vp fmt --check',
            cache: { input: [{ auto: true }], output: [] },
        },
        lint: { command: 'vp lint --fix', cache: { input: [{ auto: true }], output: [] } },
        'lint:check': { command: 'vp lint', cache: { input: [{ auto: true }], output: [] } },
        check: { command: 'vp check', cache: { input: [{ auto: true }], output: [] } },
        'check:fix': { command: 'vp check --fix', cache: { input: [{ auto: true }], output: [] } },
    };
}

export interface WorkspaceViteOptions {
    /** The pack entry map, relative to the workspace. */
    entry: Record<string, string>;
    /** Packages to always inline (defaults to the shared package). */
    alwaysBundle?: RegExp[];
    /** Override the pack `exports` option (used to keep Yarn's `bin` shape). */
    exports?: PackUserConfig['exports'];
}

/**
 * A workspace's hand-written plugin-mode `vite.config.ts`.
 *
 * Each package dogfoods the `dbx()` plugin once the workspace package has been
 * built, so the pack config can keep using the shared `baseTsdownConfig` / alias
 * helpers — functions and regexes that a generated static config cannot
 * serialize. On a clean checkout the plugin cannot resolve until the first
 * build, so config loading falls back to the explicit `pack`/`run` options.
 *
 * The plugin is passed no inline toolchain config: the workspace inherits the
 * root `fmt`/`lint` sections, so package-local `vp fmt` / `vp lint` use the same
 * Oxfmt/Oxlint options (and ignore patterns) as the root instead of the
 * defaults a bare `fmt: true` / `lint: true` would select.
 */
export function workspaceViteConfig(options: WorkspaceViteOptions): ViteUserConfig {
    const { entry, alwaysBundle = SHARED_ONLY, exports: exportsOption } = options;
    const dbx = resolveDbxPlugin();
    return {
        plugins: dbx ? [dbx()] : [],
        resolve: { tsconfigPaths: true },
        pack: {
            ...baseTsdownConfig,
            alias: workspacePackageAliases(),
            entry,
            deps: {
                ...baseTsdownConfig.deps,
                neverBundle: [/(^node:)|\/tests\/|node_modules/, /^@deltabox\/toolchain\//],
                alwaysBundle,
            },
            ...(exportsOption !== undefined ? { exports: exportsOption } : {}),
        },
        test: {
            environment: 'node',
            include: ['tests/**/*.test.ts'],
            testTimeout: 20000,
        },
        run: { tasks: workspaceTasks() },
    };
}
