import fs from 'node:fs';
import path from 'node:path';

import { findConfigFile } from './loader.js';
import { MANIFEST_DIR, readManifest } from './manifest.js';
import { resolveManagedPath } from './paths.js';
import { type SelectProjectsOptions, selectProjects } from './select.js';

/** What parts of the tooling to remove for a project. */
export interface ResetSelectors {
    /** Remove the generated/managed files listed in the manifest. */
    generated?: boolean;
    /** Remove the `.dbx/toolchain` directory (manifest + graph). */
    manifest?: boolean;
    /** Remove the `dbx.config.*` file(s). */
    config?: boolean;
}

/**
 * Undo the state a sync applied to user-owned files before the manifest that
 * records it is removed (eg. `tsconfig.overrides`). Returns the repo-relative
 * files it restored (or would restore on a dry run).
 */
export type ResetRestore = (cwd: string, options: { dryRun: boolean }) => string[];

export interface ResetToolchainOptions extends ResetSelectors {
    /** The project directory to reset. */
    cwd: string;
    /** Report what would be removed without deleting anything. */
    dryRun?: boolean;
    /** Run before the manifest is removed, while its recorded state still exists. */
    restore?: ResetRestore;
}

export interface ResetToolchainResult {
    /** Repo-relative paths removed (or that would be removed). */
    removed: string[];
    /** User-owned files restored before the manifest was removed. */
    restored: string[];
    /** Manifest paths ignored because they resolve outside the project root. */
    skipped: string[];
    /** Whether this was a dry run. */
    dryRun: boolean;
}

/** Normalize a path to forward slashes. */
function norm(value: string): string {
    return value.replace(/\\/g, '/');
}

/** Resolve the selectors, defaulting to generated files + the manifest. */
function resolveSelectors(options: ResetSelectors): Required<ResetSelectors> {
    const explicit =
        options.generated !== undefined ||
        options.manifest !== undefined ||
        options.config !== undefined;
    return {
        generated: options.generated ?? !explicit,
        manifest: options.manifest ?? !explicit,
        config: options.config ?? false,
    };
}

/**
 * Remove the tooling artifacts from a single project: the generated files
 * recorded in `.dbx/toolchain/manifest.json`, the `.dbx/toolchain` directory and/or
 * the `dbx.config.*` file. With no selectors the generated files + the
 * manifest directory are removed (the config is kept).
 */
export function resetToolchain(options: ResetToolchainOptions): ResetToolchainResult {
    const { cwd } = options;
    const dryRun = options.dryRun ?? false;
    const selectors = resolveSelectors(options);
    const removed: string[] = [];
    const skipped: string[] = [];

    const removeFile = (abs: string, rel: string): void => {
        if (!fs.existsSync(abs)) return;
        if (!dryRun) fs.rmSync(abs, { force: true });
        removed.push(rel);
    };

    if (selectors.generated) {
        const manifest = readManifest(cwd);
        for (const rel of manifest.files) {
            // Adopted files existed before dbx first managed them. A sync never
            // deletes them when their section goes away, so reset must not either.
            // A legacy manifest without `origins` cannot distinguish created from
            // adopted files, so leave them alone too: only an explicit `created`
            // origin is deletable.
            if (manifest.origins?.[rel] !== 'created') continue;
            let abs: string;
            try {
                abs = resolveManagedPath(cwd, rel);
            } catch {
                // Never follow a tampered/invalid manifest entry outside the root.
                skipped.push(rel);
                continue;
            }
            removeFile(abs, rel);
        }
    }

    if (selectors.config) {
        const config = findConfigFile(cwd);
        if (config) removeFile(config, norm(path.relative(cwd, config)));
    }

    const restored: string[] = [];
    if (selectors.manifest && options.restore) {
        restored.push(...options.restore(cwd, { dryRun }));
    }

    if (selectors.manifest) {
        const dir = path.resolve(cwd, MANIFEST_DIR);
        if (fs.existsSync(dir)) {
            // `.dbx/toolchain` also holds user configuration (project registries,
            // local templates, provider files). Only remove the generated state;
            // keep the directory when any user data remains.
            const generated = new Set(['manifest.json', 'timestamps.json', 'projects.json']);
            const entries = fs.readdirSync(dir);
            const generatedEntries = entries.filter(entry => generated.has(entry)).sort();
            const remaining = entries.filter(entry => !generated.has(entry));
            if (!dryRun) {
                for (const entry of generatedEntries) {
                    fs.rmSync(path.join(dir, entry), { force: true });
                }
                if (remaining.length === 0) fs.rmSync(dir, { recursive: true, force: true });
            }
            if (remaining.length === 0) {
                removed.push(`${MANIFEST_DIR}/`);
            } else {
                removed.push(...generatedEntries.map(entry => `${MANIFEST_DIR}/${entry}`));
            }
        }
    }

    return { removed, restored, skipped, dryRun };
}

export interface ResetProjectsOptions extends ResetSelectors, Omit<SelectProjectsOptions, 'kind'> {
    /** Apply to every discovered project under `root` (not just `root`). */
    recursive?: boolean;
    dryRun?: boolean;
    /** Run per project before its manifest is removed (see {@link ResetRestore}). */
    restore?: ResetRestore;
}

export interface ResetProjectsResult {
    results: {
        dir: string;
        rel: string;
        removed: string[];
        restored: string[];
        skipped: string[];
    }[];
    dryRun: boolean;
}

/**
 * Reset one or many projects. When `recursive` is set every discovered project
 * (optionally filtered by `include`/`exclude`) is reset; otherwise only `root`.
 */
export function resetProjects(options: ResetProjectsOptions): ResetProjectsResult {
    const dryRun = options.dryRun ?? false;
    const targets = options.recursive
        ? selectProjects({
              root: options.root,
              ...(options.include ? { include: options.include } : {}),
              ...(options.exclude ? { exclude: options.exclude } : {}),
              ...(options.maxDepth !== undefined ? { maxDepth: options.maxDepth } : {}),
          })
        : [{ dir: options.root, rel: '.', hasConfig: Boolean(findConfigFile(options.root)) }];

    const results = targets.map(target => {
        const { removed, restored, skipped } = resetToolchain({
            cwd: target.dir,
            ...(options.generated !== undefined ? { generated: options.generated } : {}),
            ...(options.manifest !== undefined ? { manifest: options.manifest } : {}),
            ...(options.config !== undefined ? { config: options.config } : {}),
            ...(options.restore ? { restore: options.restore } : {}),
            dryRun,
        });
        return { dir: target.dir, rel: target.rel, removed, restored, skipped };
    });

    return { results, dryRun };
}
