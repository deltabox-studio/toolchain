import { fileURLToPath } from 'node:url';

import { defineConfig } from 'tsdown';

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
        '@deltabox/toolchain-shared': src('packages/shared/src/index.ts'),
        '@deltabox/toolchain-config/cli': src('packages/config/src/cli/index.ts'),
        '@deltabox/toolchain-config': src('packages/config/src/index.ts'),
        '@deltabox/toolchain-core': src('packages/core/src/index.ts'),
        '@deltabox/toolchain-changelog/cli': src('packages/changelog/src/cli/index.ts'),
        '@deltabox/toolchain-changelog': src('packages/changelog/src/index.ts'),
        '@deltabox/toolchain-tsconfig/cli': src('packages/tsconfig/src/cli/index.ts'),
        '@deltabox/toolchain-tsconfig': src('packages/tsconfig/src/index.ts'),
        '@deltabox/toolchain-tsdown/cli': src('packages/tsdown/src/cli/index.ts'),
        '@deltabox/toolchain-tsdown/config/node': src('packages/tsdown/src/config/node.ts'),
        '@deltabox/toolchain-tsdown': src('packages/tsdown/src/index.ts'),
        '@deltabox/toolchain-biome': src('packages/biome/src/index.ts'),
        '@deltabox/toolchain-project/cli': src('packages/project/src/cli/index.ts'),
        '@deltabox/toolchain-project': src('packages/project/src/index.ts'),
        '@deltabox/toolchain-migrate/cli': src('packages/migrate/src/cli/index.ts'),
        '@deltabox/toolchain-migrate': src('packages/migrate/src/index.ts'),
        '@deltabox/toolchain-template/cli': src('packages/template/src/cli/index.ts'),
        '@deltabox/toolchain-template': src('packages/template/src/index.ts'),
        '@deltabox/toolchain-vite/cli': src('packages/vite/src/cli/index.ts'),
        '@deltabox/toolchain-vite': src('packages/vite/src/index.ts'),
    },
    deps: {
        alwaysBundle: id => !id.startsWith('node:') && !/^tsx(\/|$)/.test(id),
        neverBundle: [/^node:/, /^tsx(\/|$)/],
    },
});
