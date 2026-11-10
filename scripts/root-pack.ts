import { fileURLToPath } from 'node:url';

import type { PackUserConfig } from 'vite-plus/pack';

import { baseTsdownConfig } from '../packages/tsdown/src/config/node.js';
import { workspaceSourceAliases } from '../packages/tsdown/src/config/workspace.js';

/** Repo root: this config lives under `scripts/`. */
const root = fileURLToPath(new URL('..', import.meta.url));

/**
 * The root `@deltabox/toolchain` pack config.
 *
 * It is the `pack` field `vite.config.ts` hands to Vite+ (so `vp pack` builds the
 * root) and the config the checkout bootstrap (`scripts/bootstrap.mjs`) loads
 * directly with tsdown. The bootstrap cannot use `vp pack`: loading
 * `vite.config.ts` imports the `dbx()` plugin from the built `dist`, which does
 * not exist yet on a fresh checkout.
 *
 * `@deltabox/toolchain` is the single published package; the `packages/*`
 * workspaces are private and inlined here. Each workspace is aliased to its
 * `src` so the root build is the only build (no per-workspace dist required),
 * and `unbundle` preserves the source structure in `dist` instead of collapsing
 * the `api` + `cli` into one bundle.
 */
export const rootPackConfig: PackUserConfig = {
    ...baseTsdownConfig,
    cwd: root,
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
        mcp: 'src/mcp.ts',
        migrate: 'src/migrate.ts',
        project: 'src/project.ts',
        providers: 'src/providers.ts',
        template: 'src/template.ts',
        docker: 'src/docker.ts',
        vite: 'src/vite.ts',
    },
    alias: workspaceSourceAliases(),
    deps: {
        ...baseTsdownConfig.deps,
        alwaysBundle: [/^@deltabox\/toolchain\//],
        // Keep the optional `tsx` loader external: bundling a bare specifier
        // bakes the *build machine's* absolute path into `dist`, which breaks the
        // config loader's transpile fallback everywhere else.
        neverBundle: [
            ...(Array.isArray(baseTsdownConfig.deps?.neverBundle)
                ? baseTsdownConfig.deps.neverBundle
                : []),
            /^tsx(\/|$)/,
        ],
    },
    // Keep the published CLI command name stable (`dbx`) instead of deriving it
    // from the package name.
    exports: { enabled: true, bin: { dbx: 'src/cli/index.ts' } },
};

export default rootPackConfig;
