/**
 * The root `postinstall`: activate husky (a checkout-only step) and bootstrap
 * the built `dist` the generated `vite.config.ts` shim needs.
 *
 * The root `vite.config.ts` is a shim that imports `@deltabox/toolchain/vite`, so
 * `vp` — which loads that config to resolve `run.tasks`/`fmt`/`lint` — needs
 * `dist/vite.js` to exist. Building `dist` normally goes through `vp`, which is a
 * cycle on a fresh checkout (no `dist` -> the shim cannot be resolved -> `vp`
 * cannot run).
 *
 * This builds the two things the root build itself needs — `packages/shared`
 * (the leaf the root tsdown config resolves through) and then the root `dist` —
 * directly with tsdown, so `yarn install` leaves the repo ready for any `vp`
 * command. It is a no-op once `dist/vite.js` exists.
 *
 * The same `postinstall` also runs for consumers who install the published
 * package (npm runs a dependency's `postinstall`). Every step below is therefore
 * guarded so a consumer install is a clean no-op: husky only runs in a checkout
 * (`.husky` present) and the build only runs when there is a source tree
 * (`packages/` present).
 */

import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsdown = path.join(root, 'node_modules', 'tsdown', 'dist', 'run.mjs');

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
if (!fs.existsSync(tsdown)) process.exit(0);
if (fs.existsSync(path.join(root, 'dist', 'vite.js'))) process.exit(0);
// A published install ships `dist` but no source tree to build.
if (!fs.existsSync(path.join(root, 'packages'))) process.exit(0);

const build = cwd =>
    execFileSync(process.execPath, [tsdown, '--config-loader', 'unrun'], {
        cwd,
        stdio: 'inherit',
    });

const shared = path.join(root, 'packages', 'shared');
if (!fs.existsSync(path.join(shared, 'dist', 'index.js'))) build(shared);
build(root);
