/**
 * The root `postinstall`: activate husky (a checkout-only step) and bootstrap
 * the built `dist` the root `vite.config.ts` needs.
 *
 * The root `vite.config.ts` imports the `dbx()` plugin from
 * `@deltabox/toolchain/vite`, so `vp` — which loads that config to resolve
 * `run.tasks`/`fmt`/`lint`/`pack` — needs `dist/vite.js` to exist. Building
 * `dist` normally goes through `vp pack`, which is a cycle on a fresh checkout
 * (no `dist` -> the plugin cannot be resolved -> `vp` cannot load the config).
 *
 * This builds the root `dist` directly with tsdown from the shared
 * `scripts/root-pack.ts` config (the same object `vite.config.ts` exposes as
 * `pack`), so `yarn install` leaves the repo ready for any `vp` command. It is a
 * no-op once `dist/vite.js` exists.
 *
 * The same `postinstall` also runs for consumers who install the published
 * package (npm runs a dependency's `postinstall`). Every step below is therefore
 * guarded so a consumer install is a clean no-op: husky only runs in a checkout
 * (`.husky` present) and the build only runs when there is a source tree
 * (`packages/` present).
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Checkout-only: activate husky's git hooks. A published install has no `.husky`,
// and `husky` is a devDependency (absent for consumers), so never fail on it.
if (fs.existsSync(path.join(root, '.husky'))) {
    try {
        execSync('husky', { cwd: root, stdio: 'inherit' });
    } catch {
        // best-effort: a missing husky must not fail the install
    }
}

// Nothing to do before dependencies are installed, or once bootstrapped.
if (!fs.existsSync(path.join(root, 'node_modules', 'vite-plus'))) process.exit(0);
if (fs.existsSync(path.join(root, 'dist', 'vite.js'))) process.exit(0);
// A published install ships `dist` but no source tree to build.
if (!fs.existsSync(path.join(root, 'packages'))) process.exit(0);

// Load the shared pack config through `unrun` (TypeScript + `.js` -> `.ts`) and
// build it with Vite+'s bundled tsdown. `vite-plus` is the toolchain, so this
// needs no separate `tsdown` install.
const { unrun } = await import('unrun');
const loaded = await unrun({ path: path.join(root, 'scripts', 'root-pack.ts') });
const config = loaded.module?.default ?? loaded.module?.rootPackConfig ?? loaded.module;
const { build } = await import('vite-plus/pack');
await build(config);
