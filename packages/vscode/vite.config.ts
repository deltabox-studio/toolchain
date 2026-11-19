import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

import { baseTsdownConfig } from '../pack/src/config/node.js';
import { workspaceSourceAliases } from '../pack/src/config/workspace.js';
import { resolveDbxPlugin, workspaceTasks } from '../../scripts/workspace-vite.js';

/** Repo root (this config lives in `packages/vscode/`). */
const root = fileURLToPath(new URL('../..', import.meta.url));
/** Resolve a repo-relative path to an absolute one. */
const src = (file: string): string => fileURLToPath(new URL(`../../${file}`, import.meta.url));
const dbx = resolveDbxPlugin();

/**
 * Two packages are produced here:
 *
 * - `extension`: the extension host entry (CommonJS, `vscode` provided by the
 *   host, never bundled).
 * - `dbx`: the single-file CommonJS `dbx` CLI shipped inside the VSIX so a
 *   consumer never has to install `@deltabox/toolchain`. Every first-party
 *   workspace (aliased back to its `src`) and npm dependency is inlined; only
 *   Node built-ins stay external (`tsx` is the one exception, loaded as a
 *   dynamic native-backed fallback).
 *
 * `vp pack` builds both; `-F extension` / `-F dbx` selects one.
 */
export default defineConfig({
    plugins: dbx ? [dbx({ toolchain: { fmt: true, lint: true } })] : [],
    resolve: { tsconfigPaths: true },
    pack: [
        {
            name: 'extension',
            ...baseTsdownConfig,
            entry: { extension: 'src/extension.ts' },
            format: ['cjs'],
            fixedExtension: true,
            dts: false,
            minify: false,
            sourcemap: true,
            publint: false,
            exports: false,
            deps: {
                ...baseTsdownConfig.deps,
                neverBundle: [/(^node:)|\/tests\/|node_modules/, /^vscode$/],
            },
        },
        {
            name: 'dbx',
            ...baseTsdownConfig,
            cwd: root,
            entry: { dbx: 'src/cli/index.ts' },
            outDir: 'packages/vscode/dist',
            format: ['cjs'],
            fixedExtension: true,
            dts: false,
            clean: false,
            exports: false,
            unbundle: false,
            minify: true,
            shims: true,
            tsconfig: 'tsconfig.build.json',
            publint: false,
            sourcemap: false,
            alias: {
                // `jsonc-parser`'s UMD entry keeps relative `require('./impl/*')`
                // calls that a single-file CJS bundle cannot resolve. Use its ESM
                // entry so rolldown can inline the statically imported modules.
                'jsonc-parser': src('node_modules/jsonc-parser/lib/esm/main.js'),
                ...workspaceSourceAliases(),
            },
            deps: {
                alwaysBundle: id => !id.startsWith('node:') && !/^tsx(\/|$)/.test(id),
                neverBundle: [/^node:/, /^tsx(\/|$)/],
            },
        },
    ],
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        testTimeout: 20000,
    },
    run: { tasks: workspaceTasks() },
});
