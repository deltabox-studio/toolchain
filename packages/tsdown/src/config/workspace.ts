import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Alias the private `@deltabox/toolchain/<name>` workspace specifiers to their
 * `src` for repo-local tsdown builds.
 *
 * The published package exposes these as real subpaths (`./shared`, `./core`,
 * ...), but the per-workspace builds run before the root `dist` exists, so the
 * repo aliases them back to source (mirroring `tsdown.config.ts`). This helper is
 * repo-internal: it is not re-exported from `src/index.ts`.
 */
export function workspacePackageAliases(): Record<string, string> {
    return {
        '@deltabox/toolchain/shared': '@deltabox/toolchain-shared',
        '@deltabox/toolchain/config/cli': '@deltabox/toolchain-config/cli',
        '@deltabox/toolchain/config': '@deltabox/toolchain-config',
        '@deltabox/toolchain/core': '@deltabox/toolchain-core',
        '@deltabox/toolchain/changelog/cli': '@deltabox/toolchain-changelog/cli',
        '@deltabox/toolchain/changelog': '@deltabox/toolchain-changelog',
        '@deltabox/toolchain/tsconfig/cli': '@deltabox/toolchain-tsconfig/cli',
        '@deltabox/toolchain/tsconfig': '@deltabox/toolchain-tsconfig',
        '@deltabox/toolchain/tsdown/cli': '@deltabox/toolchain-tsdown/cli',
        '@deltabox/toolchain/tsdown/config/node': '@deltabox/toolchain-tsdown/config/node',
        '@deltabox/toolchain/tsdown': '@deltabox/toolchain-tsdown',
        '@deltabox/toolchain/biome': '@deltabox/toolchain-biome',
        '@deltabox/toolchain/project/cli': '@deltabox/toolchain-project/cli',
        '@deltabox/toolchain/project': '@deltabox/toolchain-project',
        '@deltabox/toolchain/migrate/cli': '@deltabox/toolchain-migrate/cli',
        '@deltabox/toolchain/migrate': '@deltabox/toolchain-migrate',
        '@deltabox/toolchain/template/cli': '@deltabox/toolchain-template/cli',
        '@deltabox/toolchain/template': '@deltabox/toolchain-template',
        '@deltabox/toolchain/vite/cli': '@deltabox/toolchain-vite/cli',
        '@deltabox/toolchain/vite': '@deltabox/toolchain-vite',
    };
}

export function workspaceSourceAliases(root?: string): Record<string, string> {
    const repo = root ?? fileURLToPath(new URL('../../../../', import.meta.url));
    const pkg = (name: string): string => path.join(repo, 'packages', name, 'src', 'index.ts');
    const sub = (name: string, entry: string): string =>
        path.join(repo, 'packages', name, 'src', entry);

    return {
        '@deltabox/toolchain/shared': pkg('shared'),
        '@deltabox/toolchain/config/cli': sub('config', 'cli/index.ts'),
        '@deltabox/toolchain/config': pkg('config'),
        '@deltabox/toolchain/core': pkg('core'),
        '@deltabox/toolchain/changelog/cli': sub('changelog', 'cli/index.ts'),
        '@deltabox/toolchain/changelog': pkg('changelog'),
        '@deltabox/toolchain/tsconfig/cli': sub('tsconfig', 'cli/index.ts'),
        '@deltabox/toolchain/tsconfig': pkg('tsconfig'),
        '@deltabox/toolchain/tsdown/cli': sub('tsdown', 'cli/index.ts'),
        '@deltabox/toolchain/tsdown/config/node': sub('tsdown', 'config/node.ts'),
        '@deltabox/toolchain/tsdown': pkg('tsdown'),
        '@deltabox/toolchain/biome': pkg('biome'),
        '@deltabox/toolchain/project/cli': sub('project', 'cli/index.ts'),
        '@deltabox/toolchain/project': pkg('project'),
        '@deltabox/toolchain/migrate/cli': sub('migrate', 'cli/index.ts'),
        '@deltabox/toolchain/migrate': pkg('migrate'),
        '@deltabox/toolchain/template/cli': sub('template', 'cli/index.ts'),
        '@deltabox/toolchain/template': pkg('template'),
        '@deltabox/toolchain/vite/cli': sub('vite', 'cli/index.ts'),
        '@deltabox/toolchain/vite': pkg('vite'),
    };
}
