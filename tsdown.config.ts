import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from './packages/tsdown/src/config/node.js';
import { workspaceSourceAliases } from './packages/tsdown/src/config/workspace.js';

/** The base config's never-bundle list (`true` means "all dependencies"). */
const baseNeverBundle = baseTsdownConfig.deps?.neverBundle;
const neverBundle = [...(Array.isArray(baseNeverBundle) ? baseNeverBundle : []), /^tsx(\/|$)/];

/**
 * `@deltabox/toolchain` is the single published package; the `packages/*`
 * workspaces are private and inlined here. Each workspace is aliased to its
 * `src` so the root build is the only build (no per-workspace dist required),
 * and `unbundle` preserves the source structure in `dist` instead of collapsing
 * the `api` + `cli` into one bundle.
 */
export default defineConfig({
    ...baseTsdownConfig,
    unbundle: true,
    entry: {
        index: 'src/index.ts',
        globals: 'src/globals.ts',
        'cli/index': 'src/cli/index.ts',
        shared: 'src/shared.ts',
        config: 'src/config.ts',
        core: 'src/core.ts',
        changelog: 'src/changelog.ts',
        tsconfig: 'src/tsconfig.ts',
        tsdown: 'src/tsdown.ts',
        biome: 'src/biome.ts',
        migrate: 'src/migrate.ts',
        project: 'src/project.ts',
        providers: 'src/providers.ts',
        template: 'src/template.ts',
        vite: 'src/vite.ts',
    },
    alias: workspaceSourceAliases(),
    deps: {
        ...baseTsdownConfig.deps,
        alwaysBundle: [/^@deltabox\/toolchain\//],
        // Keep the optional `tsx` loader external: bundling a bare specifier
        // bakes the *build machine's* absolute path into `dist`, which breaks the
        // config loader's transpile fallback everywhere else.
        neverBundle,
    },
    // Keep the published CLI command name stable (`dbx`) instead of
    // deriving it from the package name.
    exports: { enabled: true, bin: { dbx: 'src/cli/index.ts' } },
});
