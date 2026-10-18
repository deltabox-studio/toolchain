/**
 * Bootstrap the built `dist` the generated `vite.config.ts` shim needs.
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
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsdown = path.join(root, 'node_modules', 'tsdown', 'dist', 'run.mjs');

// Nothing to do before dependencies are installed, or once bootstrapped.
if (!fs.existsSync(tsdown)) process.exit(0);
if (fs.existsSync(path.join(root, 'dist', 'vite.js'))) process.exit(0);

const build = cwd =>
    execFileSync(process.execPath, [tsdown, '--config-loader', 'unrun'], {
        cwd,
        stdio: 'inherit',
    });

const shared = path.join(root, 'packages', 'shared');
if (!fs.existsSync(path.join(shared, 'dist', 'index.js'))) build(shared);
build(root);
