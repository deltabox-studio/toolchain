import { fileURLToPath } from 'node:url';

import { defineConfig } from 'tsdown';

import { baseTsdownConfig } from './packages/tsdown/src/config/node.js';

/** Resolve a repo-relative path to an absolute one (rolldown needs absolutes). */
const src = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

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
    deps: { ...baseTsdownConfig.deps, alwaysBundle: [/^@deltabox\/tooling-/] },
    // Keep the published CLI command name stable (`dbx`) instead of
    // deriving it from the package name.
    exports: { enabled: true, bin: { dbx: 'src/cli/index.ts' } },
});
