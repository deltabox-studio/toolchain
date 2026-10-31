import fs from 'node:fs';
import path from 'node:path';

import { detectProjectType, selectProjects } from '@deltabox/toolchain-core';
import {
    ensureViteFmtIgnore,
    extractViteObject,
    findViteConfig,
    foldViteIntoConfig,
    scanLiteralObject,
} from '@deltabox/toolchain-migrate';
import {
    type PackageJson,
    projectFromPackageJson,
    type ProjectType,
    readJsonAt,
} from '@deltabox/toolchain-shared';

import { renderToolchainConfig } from './typescript.js';

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
    /** How an existing hand-written `vite.config.*` was handled. */
    vite?: { path: string; folded: boolean; error?: string };
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
        // Seed the package manager from the existing package.json (so a pnpm
        // project does not get pinned to yarn), falling back to the defaults.
        const fromPkg = pkg ? projectFromPackageJson(pkg) : undefined;
        const content = renderToolchainConfig({
            name,
            ...(scope ? { scope } : {}),
            type,
            ...(fromPkg?.description ? { description: fromPkg.description } : {}),
            ...(fromPkg?.author ? { author: fromPkg.author } : {}),
            ...(fromPkg?.license ? { license: fromPkg.license } : {}),
            ...(fromPkg?.homepage ? { homepage: fromPkg.homepage } : {}),
            ...(fromPkg?.repo ? { repo: fromPkg.repo } : {}),
            ...(fromPkg?.nodeVersion ? { nodeVersion: fromPkg.nodeVersion } : {}),
            ...(fromPkg?.packageManager ? { packageManager: fromPkg.packageManager } : {}),
            ...(fromPkg?.packageManagerVersion
                ? { packageManagerVersion: fromPkg.packageManagerVersion }
                : {}),
        });

        // Consider an existing hand-written vite.config.*: fold its props into
        // `toolchain.vite` so the generated config already owns that setup.
        let finalContent = content;
        let vite: GeneratedProjectConfig['vite'];
        const viteFile = findViteConfig(project.dir);
        if (viteFile) {
            try {
                const source = fs.readFileSync(viteFile, 'utf-8').replace(/^\uFEFF/, '');
                if (!source.includes('@deltabox/toolchain/vite')) {
                    const extracted = extractViteObject(source);
                    const literal =
                        'error' in extracted ? undefined : scanLiteralObject(extracted.text);
                    if ('error' in extracted || !literal?.ok) {
                        vite = {
                            path: viteFile,
                            folded: false,
                            error:
                                'error' in extracted
                                    ? extracted.error
                                    : (literal as { reason: string }).reason,
                        };
                    } else {
                        const folded = foldViteIntoConfig(
                            content,
                            ensureViteFmtIgnore(extracted.text)
                        );
                        if ('content' in folded) {
                            finalContent = folded.content;
                            vite = { path: viteFile, folded: true };
                        } else {
                            vite = { path: viteFile, folded: false, error: folded.error };
                        }
                    }
                }
            } catch (error) {
                vite = { path: viteFile, folded: false, error: String(error) };
            }
        }

        if (!dryRun) fs.writeFileSync(configPath, finalContent, 'utf-8');
        created.push(project.rel);
        configs.push({
            dir: project.dir,
            rel: project.rel,
            ...(project.name ? { name: project.name } : {}),
            type,
            configPath,
            created: true,
            ...(vite ? { vite } : {}),
        });
    }

    return { configs, created, skipped, dryRun };
}
