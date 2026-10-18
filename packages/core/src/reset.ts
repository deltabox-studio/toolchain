import fs from 'node:fs';
import path from 'node:path';

import { findConfigFile } from './loader.js';
import { MANIFEST_DIR, readManifest } from './manifest.js';
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

export interface ResetToolchainOptions extends ResetSelectors {
    /** The project directory to reset. */
    cwd: string;
    /** Report what would be removed without deleting anything. */
    dryRun?: boolean;
}

export interface ResetToolchainResult {
    /** Repo-relative paths removed (or that would be removed). */
    removed: string[];
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

    const removeFile = (abs: string, rel: string): void => {
        if (!fs.existsSync(abs)) return;
        if (!dryRun) fs.rmSync(abs, { force: true });
        removed.push(rel);
    };

    if (selectors.generated) {
        for (const rel of readManifest(cwd).files) {
            removeFile(path.resolve(cwd, rel), rel);
        }
    }

    if (selectors.config) {
        const config = findConfigFile(cwd);
        if (config) removeFile(config, norm(path.relative(cwd, config)));
    }

    if (selectors.manifest) {
        const dir = path.resolve(cwd, MANIFEST_DIR);
        if (fs.existsSync(dir)) {
            if (!dryRun) fs.rmSync(dir, { recursive: true, force: true });
            removed.push(`${MANIFEST_DIR}/`);
        }
    }

    return { removed, dryRun };
}

export interface ResetProjectsOptions extends ResetSelectors, Omit<SelectProjectsOptions, 'kind'> {
    /** Apply to every discovered project under `root` (not just `root`). */
    recursive?: boolean;
    dryRun?: boolean;
}

export interface ResetProjectsResult {
    results: { dir: string; rel: string; removed: string[] }[];
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

    const results = targets.map(target => ({
        dir: target.dir,
        rel: target.rel,
        removed: resetToolchain({
            cwd: target.dir,
            ...(options.generated !== undefined ? { generated: options.generated } : {}),
            ...(options.manifest !== undefined ? { manifest: options.manifest } : {}),
            ...(options.config !== undefined ? { config: options.config } : {}),
            dryRun,
        }).removed,
    }));

    return { results, dryRun };
}
