import fs from 'node:fs';
import path from 'node:path';

import { detectProjectType, selectProjects } from '@deltabox/toolchain-core';
import { type PackageJson, type ProjectType, readJsonAt } from '@deltabox/toolchain-shared';

import { renderToolingConfig } from './typescript.js';

/** The file name a generated dbx config uses. */
export const GENERATED_CONFIG_FILENAME = 'dbx.config.ts';

export interface GenerateProjectConfigsOptions {
    /** Root to scan for projects. */
    root: string;
    /** Keep only projects matching one of these patterns (glob or substring). */
    include?: string[];
    /** Drop projects matching any of these patterns (glob or substring). */
    exclude?: string[];
    /** Force a project type instead of detecting it. */
    type?: ProjectType;
    /** Overwrite existing config files (default: skip projects that have one). */
    force?: boolean;
    /** Maximum directory depth to scan (default 5). */
    maxDepth?: number;
    /** Report what would be written without writing anything. */
    dryRun?: boolean;
}

/** One project considered for config generation. */
export interface GeneratedProjectConfig {
    /** Absolute project directory. */
    dir: string;
    /** Directory relative to the root (posix). */
    rel: string;
    /** Package name when available. */
    name?: string;
    /** The resolved project type. */
    type: ProjectType;
    /** The config file path (absolute). */
    configPath: string;
    /** Whether the config was (or would be) written. */
    created: boolean;
    /** Why the project was skipped, when it was. */
    skipped?: string;
}

export interface GenerateProjectConfigsResult {
    configs: GeneratedProjectConfig[];
    /** Project dirs whose config was (or would be) written. */
    created: string[];
    /** Project dirs skipped (already have a config). */
    skipped: string[];
    dryRun: boolean;
}

/** Derive `{ name, scope }` from a package name (`@acme/app` -> `app`/`@acme`). */
function splitName(pkgName: string | undefined, dir: string): { name: string; scope?: string } {
    if (!pkgName) return { name: path.basename(dir) };
    const match = pkgName.match(/^(@[^/]+)\/(.+)$/);
    if (match?.[1] && match[2]) return { name: match[2], scope: match[1] };
    return { name: pkgName };
}

/**
 * Generate a `dbx.config.ts` for every discovered project that is missing one
 * (unless `force`). The project type is detected from the filesystem unless
 * overridden. Returns the configs written (or that would be).
 */
export function generateProjectConfigs(
    options: GenerateProjectConfigsOptions
): GenerateProjectConfigsResult {
    const dryRun = options.dryRun ?? false;
    const force = options.force ?? false;

    const projects = selectProjects({
        root: options.root,
        ...(options.include ? { include: options.include } : {}),
        ...(options.exclude ? { exclude: options.exclude } : {}),
        ...(options.maxDepth !== undefined ? { maxDepth: options.maxDepth } : {}),
    });

    const configs: GeneratedProjectConfig[] = [];
    const created: string[] = [];
    const skipped: string[] = [];

    for (const project of projects) {
        const configPath = path.join(project.dir, GENERATED_CONFIG_FILENAME);
        const already = project.hasConfig || fs.existsSync(configPath);
        if (already && !force) {
            skipped.push(project.rel);
            configs.push({
                dir: project.dir,
                rel: project.rel,
                ...(project.name ? { name: project.name } : {}),
                type: options.type ?? detectProjectType(project.dir),
                configPath,
                created: false,
                skipped: 'has config',
            });
            continue;
        }

        const type = options.type ?? detectProjectType(project.dir);
        const pkg = readJsonAt<PackageJson>(project.dir, 'package.json');
        const { name, scope } = splitName(project.name ?? pkg?.name, project.dir);
        const content = renderToolingConfig({ name, ...(scope ? { scope } : {}), type });

        if (!dryRun) fs.writeFileSync(configPath, content, 'utf-8');
        created.push(project.rel);
        configs.push({
            dir: project.dir,
            rel: project.rel,
            ...(project.name ? { name: project.name } : {}),
            type,
            configPath,
            created: true,
        });
    }

    return { configs, created, skipped, dryRun };
}
