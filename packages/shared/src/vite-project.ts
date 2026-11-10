/**
 * Detecting whether a project is built with Vite/Vite+.
 *
 * The generated CI workflow uses `voidzero-dev/setup-vp` for Vite+ projects, so
 * the detection has to work without importing Vite: it reads the project's
 * `package.json` (walking to the repository boundary), looks for a
 * `vite.config.*` at the project root, and honours the toolchain's own `vite`
 * section (the "dbx manages the Vite+ config" mode).
 */

import fs from 'node:fs';
import path from 'node:path';

import { readJsonAt } from './fs-utils.js';
import { sectionEnabled, type ToolchainConfig } from './toolchain.js';
import type { PackageJson } from './types.js';

/** The Vite config file names, in Vite's own resolution order. */
const VITE_CONFIG_FILE_NAMES = [
    'vite.config.ts',
    'vite.config.mts',
    'vite.config.cts',
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.cjs',
] as const;

/** The `package.json` fields that declare a dependency. */
const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
] as const;

/** Find the first `vite.config.*` at `cwd`, if any. */
function findViteConfigFile(cwd: string = process.cwd()): string | undefined {
    for (const name of VITE_CONFIG_FILE_NAMES) {
        const file = path.resolve(cwd, name);
        if (fs.existsSync(file)) return file;
    }
    return undefined;
}

/**
 * Whether the project declares `vite-plus` in any `package.json` dependency
 * field. Walks up to the repository boundary (`.git`), so a workspace that
 * hoists the dependency from the root still counts.
 */
export function declaresVitePlus(cwd: string = process.cwd()): boolean {
    let dir = path.resolve(cwd);
    for (;;) {
        const pkg = readJsonAt<PackageJson>(dir, 'package.json');
        if (pkg && DEPENDENCY_FIELDS.some(field => pkg[field]?.['vite-plus'] !== undefined)) {
            return true;
        }
        if (fs.existsSync(path.join(dir, '.git'))) break;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return false;
}

/**
 * Whether the project runs on Vite/Vite+: it declares `vite-plus`, has a
 * `vite.config.*` at its root, or opts into the toolchain's `vite` (Vite+)
 * mode. `config.vite` is the explicit signal, so it wins even before the
 * project is installed.
 */
export function usesVitePlus(cwd: string = process.cwd(), config: ToolchainConfig = {}): boolean {
    if (sectionEnabled(config.vite)) return true;
    if (findViteConfigFile(cwd)) return true;
    return declaresVitePlus(cwd);
}
