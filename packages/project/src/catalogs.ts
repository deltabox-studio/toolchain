import fs from 'node:fs';
import path from 'node:path';

import {
    type ManagedFile,
    type SyncTask,
    sectionConfig,
    sectionEnabled,
    toYaml,
    type YamlValue,
} from '@deltabox/toolchain-shared';

/**
 * The catalogs feature: a package catalog (`package -> version range`) written
 * into whichever file the package manager reads it from — `.yarnrc.yml` (Yarn),
 * `pnpm-workspace.yaml` (pnpm), or the root `package.json` `workspaces.catalog`
 * (Bun). npm has no catalog support.
 */

/**
 * A marker line placed at the top of a catalog file so the sync task knows the
 * toolchain owns it (and refuses to overwrite a hand-written one).
 */
export const CATALOG_MARKER =
    '# Managed by @deltabox/toolchain (catalogs) - edit dbx.config.* and run `dbx sync`.';

/** Package managers that support catalogs. */
export const CATALOG_PACKAGE_MANAGERS = ['yarn', 'pnpm', 'bun'] as const;

/** Whether a package manager supports catalogs (defaults to Yarn). */
export function supportsCatalogs(packageManager: string | undefined): boolean {
    const pm = packageManager ?? 'yarn';
    return (CATALOG_PACKAGE_MANAGERS as readonly string[]).includes(pm);
}

/** A resolved catalog: a default map and/or named catalogs. */
export interface Catalog {
    /** The default catalog (`package -> version range`). */
    packages?: Record<string, string>;
    /** Named catalogs (Yarn `catalogs:`, pnpm `catalogs:`): name -> packages. */
    named?: Record<string, Record<string, string>>;
}

/** The file a package manager reads its catalog(s) from (undefined: none). */
export function catalogFileFor(packageManager: string | undefined): string | undefined {
    switch (packageManager ?? 'yarn') {
        case 'yarn':
            return '.yarnrc.yml';
        case 'pnpm':
            return 'pnpm-workspace.yaml';
        default:
            return undefined;
    }
}

function withMarker(yaml: string): string {
    return `${CATALOG_MARKER}\n${yaml}`;
}

/** Render a `.yarnrc.yml` (node-modules linker + the catalog(s)). */
export function renderYarnrc(catalog: Catalog): string {
    const doc: Record<string, YamlValue> = { nodeLinker: 'node-modules' };
    if (catalog.packages && Object.keys(catalog.packages).length > 0) {
        doc.catalog = catalog.packages;
    }
    if (catalog.named && Object.keys(catalog.named).length > 0) doc.catalogs = catalog.named;
    return withMarker(toYaml(doc));
}

/** Render a `pnpm-workspace.yaml` (optional `packages` globs + the catalog(s)). */
export function renderPnpmWorkspace(catalog: Catalog, packages?: string[]): string {
    const doc: Record<string, YamlValue> = {};
    if (packages && packages.length > 0) doc.packages = packages;
    if (catalog.packages && Object.keys(catalog.packages).length > 0) {
        doc.catalog = catalog.packages;
    }
    if (catalog.named && Object.keys(catalog.named).length > 0) doc.catalogs = catalog.named;
    return withMarker(toYaml(doc));
}

/**
 * The `catalogs` sync task: writes the catalog(s) into the package manager's
 * file. Yarn and pnpm write a dedicated file (`.yarnrc.yml` /
 * `pnpm-workspace.yaml`); Bun's catalog lives in `package.json` (handled by the
 * `project` task / scaffolding) and npm has no catalog support, so both warn.
 * A catalog file is only written when it is absent or already toolchain-managed
 * (it carries {@link CATALOG_MARKER}); a hand-written file is never clobbered.
 */
export function catalogsSyncTask(): SyncTask {
    return {
        name: 'catalogs',
        projectTypes: ['monorepo-root', 'project', 'monorepo-workspace'],
        // Never delete a catalog file, even when the task stops producing it
        // (eg. the user replaced the managed file with their own): the catalog
        // files are read by the package manager and may hold hand-written keys.
        keep: ['.yarnrc.yml', 'pnpm-workspace.yaml'],
        enabled: config => sectionEnabled(config.catalogs),
        run: ctx => {
            const config = sectionConfig(ctx.config.catalogs) ?? {};
            const packageManager = ctx.config.project?.packageManager ?? 'yarn';
            const catalog: Catalog = {
                ...(config.packages ? { packages: config.packages } : {}),
                ...(config.named ? { named: config.named } : {}),
            };
            if (Object.keys(catalog.packages ?? {}).length === 0 && !catalog.named) {
                return [];
            }
            if (!supportsCatalogs(packageManager)) {
                ctx.warn(`catalogs: ${packageManager} has no catalog support; nothing written.`);
                return [];
            }
            if (packageManager === 'bun') {
                ctx.warn(
                    'catalogs: Bun catalogs live in package.json; declare them there (or use yarn/pnpm).'
                );
                return [];
            }
            const file = catalogFileFor(packageManager);
            if (!file) return [];

            const abs = path.resolve(ctx.cwd, file);
            if (fs.existsSync(abs)) {
                const current = fs.readFileSync(abs, 'utf-8');
                if (!current.includes(CATALOG_MARKER)) {
                    ctx.warn(
                        `catalogs: ${file} exists and is not toolchain-managed; leaving it untouched.`
                    );
                    return [];
                }
            }
            const content =
                packageManager === 'pnpm'
                    ? renderPnpmWorkspace(
                          catalog,
                          ctx.projectType === 'monorepo-root' ? ['packages/*'] : undefined
                      )
                    : renderYarnrc(catalog);
            const files: ManagedFile[] = [{ path: file, content }];
            return files;
        },
    };
}
