import { fileURLToPath } from 'node:url';

import { defineConfig } from 'tsdown';

import { workspaceSourceAliases } from './packages/tsdown/src/config/workspace.js';

/** Repo root (this config lives at the root); relative paths resolve from here. */
const root = fileURLToPath(new URL('.', import.meta.url));

/** Resolve a repo-relative path to an absolute one (rolldown needs absolutes). */
const src = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

/**
 * A single-file CommonJS bundle of the `dbx` CLI, shipped inside the VS Code
 * VSIX (`packages/vscode/dist/dbx.cjs`) so a consumer never has to install
 * `@deltabox/toolchain`.
 *
 * Every first-party `@deltabox/toolchain-*` workspace (aliased back to its
 * `src`, mirroring the root `tsdown.config.ts`) and npm dependency is inlined;
 * only Node built-ins (`node:*`) stay external. `tsx` is the one exception: it
 * is loaded as a dynamic, native-backed fallback in `packages/core/src/loader.ts`
 * and cannot be inlined into a single file, so it is left external.
 */
export default defineConfig({
    cwd: root,
    entry: { dbx: 'src/cli/index.ts' },
    outDir: 'packages/vscode/dist',
    format: ['cjs'],
    platform: 'node',
    fixedExtension: true,
    dts: false,
    clean: true,
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
});
