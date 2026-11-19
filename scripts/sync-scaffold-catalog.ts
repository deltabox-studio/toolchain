/**
 * Keep the scaffold catalog's `vite-plugin-dbx` pin in step with the root
 * package version.
 *
 * The `toolchain.hooks.afterVersion` hook runs this after `dbx changelog`
 * writes the new versions, before the changelog workflow commits them, so the
 * bump commit always includes the scaffold catalog update.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Update `<root>/.yarnrc.yml`'s `vite-plugin-dbx` catalog pin. */
export function syncScaffoldCatalog(
    root: string = fileURLToPath(new URL('..', import.meta.url))
): void {
    const file = path.join(root, '.yarnrc.yml');
    if (!fs.existsSync(file)) return;

    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
        version?: string;
    };
    if (typeof pkg.version !== 'string' || !pkg.version) return;

    const current = fs.readFileSync(file, 'utf8');
    const next = current.replace(/^(\s*vite-plugin-dbx:\s*)\^?[^\r\n]+$/m, `$1^${pkg.version}`);
    if (next !== current) fs.writeFileSync(file, next, 'utf8');
}
