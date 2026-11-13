import type { ViteUserConfig } from 'vite-plus';
import type { PackUserConfig } from 'vite-plus/pack';

import { dbx } from 'vite-plugin-dbx';

import { baseTsdownConfig } from '../packages/pack/src/config/node.js';
import { workspacePackageAliases } from '../packages/pack/src/config/workspace.js';

/** The workspace package's shared source alias preset. */
export const ALL_WORKSPACES = [/^@deltabox\/toolchain[-\/]/];
export const SHARED_ONLY = [/^@deltabox\/toolchain[-\/]shared/];

type WorkspaceTasks = NonNullable<NonNullable<ViteUserConfig['run']>['tasks']>;

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
        format: { command: 'vp fmt', cache: { input: [{ auto: true }], output: [] } },
        'format:check': {
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
 * Each package dogfoods the `dbx()` plugin (instead of a generated shim) so the
 * pack config can keep using the shared `baseTsdownConfig` / alias helpers —
 * functions and regexes that a generated static config cannot serialize. The
 * plugin also derives the root `fmt`/`lint` sections, and the package opts into
 * both through its `dbx.config.ts`.
 */
export function workspaceViteConfig(options: WorkspaceViteOptions): ViteUserConfig {
    const { entry, alwaysBundle = SHARED_ONLY, exports: exportsOption } = options;
    return {
        plugins: [dbx({ toolchain: { fmt: true, lint: true } })],
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
