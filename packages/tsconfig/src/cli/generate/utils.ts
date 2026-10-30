import fs from 'node:fs';
import path from 'node:path';

import type { TsConfigJson } from 'type-fest';

import { logger } from '@deltabox/toolchain-shared';

import { mergeOverride, type TsconfigOverrides } from '../../overrides.js';
import { readTsconfig, resolveTsconfig } from '../../resolve.js';

export type GeneratedTsconfigResult = ReturnType<typeof generateTsconfig>;

export function generateTsconfig(options: {
    cwd: string;
    dirname: string;
    tsconfigPath: string;
    monorepoTsconfigPath: string;
    tsconfigBuildPath: string;
    targetTsconfigPath: string;
    targetTsconfigBuildPath: string;
    indent?: number;
    ignoreAliases?: boolean;
    ignoreReferences?: boolean;
    disableComposite?: boolean;
    /** Write the generated files to disk (default true). */
    write?: boolean;
    /** Managed file overrides applied before generating. */
    overrides?: TsconfigOverrides;
}) {
    const {
        cwd,
        dirname,
        tsconfigPath,
        monorepoTsconfigPath,
        tsconfigBuildPath,
        targetTsconfigPath,
        targetTsconfigBuildPath,
        indent = 4,
        disableComposite,
        ignoreAliases,
        ignoreReferences,
        write = true,
        overrides,
    } = options;

    const dirnameRelative = path.relative(cwd, dirname).replace(/\\/g, '/') || '.';

    try {
        if (!fs.existsSync(tsconfigPath)) {
            throw new Error(`Source tsconfig not found: ${tsconfigPath}`);
        }

        if (!monorepoTsconfigPath) {
            throw new Error(`options.monorepoTsconfigPath not set for ${tsconfigPath}`);
        }

        logger.info(`  - ${dirnameRelative}`);

        const tsconfigFilename = path.basename(tsconfigPath);

        const tsconfigBuildExists = fs.existsSync(tsconfigBuildPath);

        // The workspaces tsconfig is optional: without it there is simply nothing
        // to wire (no shared `paths`/`references`), and each workspace still gets
        // a `tsconfig.json` that extends its own default. It can itself `extend`
        // another config: the resolver follows the chain per field.
        const hasMonorepo = fs.existsSync(monorepoTsconfigPath);
        const tsconfigMonorepoRaw = hasMonorepo
            ? (readTsconfig(monorepoTsconfigPath) as TsConfigJson)
            : ({} as TsConfigJson);
        const tsconfigMonorepo = mergeOverride(tsconfigMonorepoRaw, overrides?.root);
        const resolvedMonorepo = hasMonorepo
            ? resolveTsconfig({
                  tsconfig: monorepoTsconfigPath,
                  root: cwd,
                  cwd,
                  ...(overrides?.root ? { overrides: overrides.root } : {}),
              })
            : { alias: [], paths: {}, references: [] };

        const tsconfigRaw = readTsconfig(tsconfigPath) as TsConfigJson;
        const tsconfig = mergeOverride(tsconfigRaw, overrides?.default);

        const tsconfigBuildRaw = tsconfigBuildExists
            ? (readTsconfig(tsconfigBuildPath) as TsConfigJson)
            : undefined;
        const tsconfigBuild = tsconfigBuildRaw
            ? mergeOverride(tsconfigBuildRaw, overrides?.build)
            : undefined;

        const types = disableComposite
            ? []
            : [
                  ...new Set([
                      ...(tsconfig.compilerOptions?.types ?? []),
                      ...(disableComposite ? [] : (tsconfigMonorepo.compilerOptions?.types ?? [])),
                  ]),
              ];

        const monorepoPaths: Record<string, string[]> = {};
        if (!ignoreAliases) {
            for (const [key, targets] of Object.entries(resolvedMonorepo.paths)) {
                const transformed = targets
                    .map(target => toWorkspacePath(target, dirname, dirnameRelative))
                    .filter((value): value is string => value !== undefined);
                if (transformed.length > 0) monorepoPaths[key] = transformed;
            }
        }

        const references: TsConfigJson.References[] = [];
        if (!ignoreReferences) {
            const seen = new Set<string>();
            const add = (absolute: string, reference: { path: string; [key: string]: unknown }) => {
                const relative = toWorkspacePath(absolute, dirname, dirnameRelative);
                if (relative === undefined || seen.has(relative)) return;
                seen.add(relative);
                references.push({ ...reference, path: relative });
            };
            // A workspace's own references are authored relative to the repo root
            // (matching the previous behaviour); the monorepo's are resolved to
            // absolute paths by the resolver.
            for (const reference of tsconfig.references ?? []) {
                add(path.resolve(cwd, reference.path), reference);
            }
            for (const reference of resolvedMonorepo.references) {
                add(reference.path, reference);
            }
        }

        const newTsconfig: TsConfigJson = {
            ...(disableComposite ? {} : tsconfigMonorepo),
            extends: `./${tsconfigFilename}`,
            compilerOptions: {
                ...(disableComposite ? { composite: false } : tsconfigMonorepo.compilerOptions),
                ...(types.length ? { types } : {}),
                ...(ignoreAliases
                    ? {}
                    : {
                          paths: {
                              ...tsconfig.compilerOptions?.paths,
                              ...monorepoPaths,
                          },
                      }),
            },
            ...(ignoreReferences ? {} : { references }),
        };

        const newTsconfigBuild: TsConfigJson | undefined = tsconfigBuildExists
            ? { ...tsconfigBuild, extends: `./${tsconfigFilename}` }
            : undefined;

        // `tsconfig.build.json` is user-owned (like `tsconfig.default.json`):
        // it is read for the return value but never rewritten.
        void targetTsconfigBuildPath;
        if (write) {
            fs.writeFileSync(targetTsconfigPath, `${JSON.stringify(newTsconfig, null, indent)}\n`);
        }

        return {
            ...options,
            dirnameRelative,
            tsconfigFilename,
            config: newTsconfig,
            newTsconfig,
            newTsconfigBuild,
            originalConfig: tsconfigRaw,
            tsconfigMonorepo,
            tsconfigBuild,
        };
    } catch (e: any) {
        logger.error(`  Failed to extend tsconfig for ${dirnameRelative} due to: ${e}`);
        process.exit(1);
    }
}

/**
 * Render an absolute target (path or reference) relative to a workspace.
 * Targets that live inside the workspace itself are omitted for every workspace
 * except the repo root (so a package does not alias its own source).
 */
function toWorkspacePath(
    target: string,
    dirname: string,
    dirnameRelative: string
): string | undefined {
    const absolute = path.resolve(target);
    const workspace = path.resolve(dirname);
    const targetDir = path.dirname(absolute);
    const inWorkspace = targetDir === workspace || targetDir.startsWith(`${workspace}${path.sep}`);

    if (inWorkspace && dirnameRelative !== '.') return undefined;

    let relative = path.relative(workspace, absolute).replace(/\\/g, '/');
    if (!relative.startsWith('.')) relative = `./${relative}`;
    return relative;
}
