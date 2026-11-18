import fs from 'node:fs';
import path from 'node:path';

import {
    buildProjectGraph,
    detectProjectType,
    findConfigFile,
    orderProjects,
    selectProjects,
    writeProjectGraph,
} from '@deltabox/toolchain/core';
import {
    ensureViteFmtIgnore,
    extractViteObject,
    findViteConfig,
    foldViteIntoConfig,
    objectHasSections,
    scanLiteralObject,
} from '@deltabox/toolchain/migrate';
import { type PackageJson, projectFromPackageJson, readJsonAt } from '@deltabox/toolchain/shared';

import type {
    ConfigExtension,
    GenerateProjectConfigsOptions,
    GenerateProjectConfigsResult,
    GeneratedProjectConfig,
} from './types/index.js';
import {
    configFileName,
    DEFAULT_CONFIG_EXTENSION,
    isConfigExtension,
    renderToolchainConfig,
    resolveConfigExtension,
} from './typescript.js';

/** The default file name a generated dbx config uses. */
export const GENERATED_CONFIG_FILENAME = configFileName(DEFAULT_CONFIG_EXTENSION);

/** The config extension of a file, falling back to the default. */
function configExtensionOf(file: string): ConfigExtension {
    const extension = path.extname(file).slice(1);
    return isConfigExtension(extension) ? extension : DEFAULT_CONFIG_EXTENSION;
}

/** Derive `{ name, scope }` from a package name (`@acme/app` -> `app`/`@acme`). */
function splitName(pkgName: string | undefined, dir: string): { name: string; scope?: string } {
    if (!pkgName) return { name: path.basename(dir) };
    const match = pkgName.match(/^(@[^/]+)\/(.+)$/);
    if (match?.[1] && match[2]) return { name: match[2], scope: match[1] };
    return { name: pkgName };
}

/**
 * Generate a `dbx.config.*` for every discovered project that is missing one
 * (unless `force`). The project graph is written to
 * `.dbx/toolchain/projects.json` before any config, so the config generation can
 * use it as context. The project type is detected from the filesystem unless
 * overridden. Returns the configs written (or that would be).
 */
export function generateProjectConfigs(
    options: GenerateProjectConfigsOptions
): GenerateProjectConfigsResult {
    const dryRun = options.dryRun ?? false;
    const force = options.force ?? false;
    const skipConfig = options.skipConfig ?? false;
    const language = options.language ?? 'ts';
    const maxDepth = options.maxDepth !== undefined ? { maxDepth: options.maxDepth } : {};

    // Write the graph first: `dbx sync`/the extension read it, and it is the
    // context (root vs workspace) a generated config is seeded from.
    const graph = buildProjectGraph(options.root, maxDepth);
    let graphPath: string | undefined;
    if (!dryRun) graphPath = writeProjectGraph(options.root, graph);

    const projects = selectProjects({
        root: options.root,
        ...(options.include ? { include: options.include } : {}),
        ...(options.exclude ? { exclude: options.exclude } : {}),
        ...(options.maxDepth !== undefined ? { maxDepth: options.maxDepth } : {}),
        graph,
    });

    const configs: GeneratedProjectConfig[] = [];
    const created: string[] = [];
    const skipped: string[] = [];

    for (const project of projects) {
        const pkg = readJsonAt<PackageJson>(project.dir, 'package.json');
        const chosenExtension = resolveConfigExtension(language, pkg?.type, options.extension);
        const chosenPath = path.join(project.dir, configFileName(chosenExtension));
        const existingPath = project.hasConfig ? findConfigFile(project.dir) : undefined;
        const existingExtension = existingPath ? path.extname(existingPath).slice(1) : undefined;
        const reusableExisting =
            existingPath && existingExtension && isConfigExtension(existingExtension)
                ? existingPath
                : undefined;
        // An explicit language/extension switches the file; otherwise overwrite
        // the existing file in place so a project never ends up with two configs
        // (eg. `dbx.config.js` + `dbx.config.ts`).
        const explicitFormat = options.language !== undefined || options.extension !== undefined;
        const configPath =
            existingPath && (!force || (reusableExisting && !explicitFormat))
                ? existingPath
                : chosenPath;
        const extension = configExtensionOf(configPath);
        const already = Boolean(existingPath) || fs.existsSync(chosenPath);
        const type = options.type ?? detectProjectType(project.dir);
        const viteFile = findViteConfig(project.dir);
        let pluginManaged = false;
        if (viteFile) {
            try {
                pluginManaged = /@deltabox\/toolchain\/vite|vite-plugin-dbx/.test(
                    fs.readFileSync(viteFile, 'utf-8')
                );
            } catch {
                pluginManaged = false;
            }
        }

        // A project already configured through the Vite plugin needs no
        // `dbx.config.*`; the plugin carries the same toolchain settings.
        if (pluginManaged && !force) {
            skipped.push(project.rel);
            configs.push({
                dir: project.dir,
                rel: project.rel,
                ...(project.name ? { name: project.name } : {}),
                type,
                configPath,
                extension,
                created: false,
                skipped: 'uses vite-plugin-dbx',
                ...(viteFile ? { vite: { path: viteFile, folded: false } } : {}),
            });
            continue;
        }

        if (skipConfig) {
            skipped.push(project.rel);
            configs.push({
                dir: project.dir,
                rel: project.rel,
                ...(project.name ? { name: project.name } : {}),
                type,
                configPath,
                extension,
                created: false,
                skipped: 'config skipped',
            });
            continue;
        }
        if (already && !force) {
            skipped.push(project.rel);
            configs.push({
                dir: project.dir,
                rel: project.rel,
                ...(project.name ? { name: project.name } : {}),
                type,
                configPath,
                extension,
                created: false,
                skipped: 'has config',
            });
            continue;
        }

        const { name, scope } = splitName(project.name ?? pkg?.name, project.dir);
        // Seed the package manager from the existing package.json (so a pnpm
        // project does not get pinned to yarn), falling back to the defaults.
        const fromPkg = pkg ? projectFromPackageJson(pkg) : undefined;
        const content = renderToolchainConfig({
            name,
            ...(scope ? { scope } : {}),
            type,
            configExtension: extension,
            ...(pkg?.type ? { packageType: pkg.type } : {}),
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
        if (viteFile) {
            try {
                const source = fs.readFileSync(viteFile, 'utf-8').replace(/^\uFEFF/, '');
                if (!/@deltabox\/toolchain\/vite|vite-plugin-dbx/.test(source)) {
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
                            ensureViteFmtIgnore(
                                extracted.text,
                                objectHasSections(extracted.text).fmt
                            )
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

        const removed = existingPath && existingPath !== configPath ? existingPath : undefined;
        if (!dryRun) {
            fs.writeFileSync(configPath, finalContent, 'utf-8');
            if (removed) fs.rmSync(removed, { force: true });
        }
        created.push(project.rel);
        configs.push({
            dir: project.dir,
            rel: project.rel,
            ...(project.name ? { name: project.name } : {}),
            type,
            configPath,
            extension,
            created: true,
            ...(removed ? { removed } : {}),
            ...(vite ? { vite } : {}),
        });
    }

    // Keep the graph accurate for the configs just written.
    if (!dryRun && !skipConfig && created.length > 0) {
        for (const config of configs) {
            if (!config.created) continue;
            const node = graph.projects.find(
                candidate => path.resolve(options.root, candidate.dir) === config.dir
            );
            if (!node) continue;
            node.hasConfig = true;
            node.config = path.relative(options.root, config.configPath).replace(/\\/g, '/');
        }
        // Match `buildProjectGraph`: a dbx project is configured by a file or a
        // `dbx()` plugin. Config generation only adds files, so plugin projects
        // must stay in the graph it rewrites.
        graph.dbxProjects = graph.projects.filter(
            project => project.hasConfig || project.hasPlugin
        );
        graph.order = orderProjects(graph.dbxProjects);
        graph.generatedAt = new Date().toISOString();
        graphPath = writeProjectGraph(options.root, graph);
    }

    return {
        configs,
        created,
        skipped,
        dryRun,
        ...(graphPath ? { graphPath } : {}),
    };
}
