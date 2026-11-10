import fs from 'node:fs';
import path from 'node:path';

import { logger } from '@deltabox/toolchain/shared';
import type { TsConfigJson } from 'type-fest';

import { mergeOverride, type TsconfigOverrides } from '../../overrides.js';
import {
    readTsconfig,
    resolveTsconfig,
    resolveTsconfigConfig,
    resolveTsconfigFilePatterns,
    type ResolvedTsconfig,
} from '../../resolve.js';

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
    /** Effective per-workspace switches (they override the legacy ignore flags). */
    aliases?: boolean;
    refs?: boolean;
    composite?: boolean;
    /** In-memory workspaces tsconfig (the auto-generated object). */
    monorepoConfig?: TsConfigJson;
    /** Write the generated files to disk (default true). */
    write?: boolean;
    /** Log sink (default: the shared info logger). Pass a no-op to stay quiet. */
    log?: (message: string) => void;
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
        aliases,
        refs,
        composite,
        monorepoConfig,
        write = true,
        log = (message: string) => logger.info(message),
        overrides,
    } = options;
    const enableAliases = aliases ?? !ignoreAliases;
    const enableRefs = refs ?? !ignoreReferences;
    const enableComposite = composite ?? !disableComposite;

    const dirnameRelative = path.relative(cwd, dirname).replace(/\\/g, '/') || '.';

    try {
        if (!fs.existsSync(tsconfigPath)) {
            throw new Error(`Source tsconfig not found: ${tsconfigPath}`);
        }

        if (!monorepoTsconfigPath) {
            throw new Error(`options.monorepoTsconfigPath not set for ${tsconfigPath}`);
        }

        log(`  - ${dirnameRelative}`);

        const tsconfigFilename = path.basename(tsconfigPath);

        const tsconfigBuildExists = fs.existsSync(tsconfigBuildPath);

        // The workspaces tsconfig is optional: without it there is simply nothing
        // to wire (no shared `paths`/`references`), and each workspace still gets
        // a `tsconfig.json` that extends its own default. It can itself `extend`
        // another config: the resolver follows the chain per field.
        const hasMonorepo = monorepoConfig !== undefined || fs.existsSync(monorepoTsconfigPath);
        const tsconfigMonorepoRaw =
            monorepoConfig ??
            (hasMonorepo
                ? (readTsconfig(monorepoTsconfigPath) as TsConfigJson)
                : ({} as TsConfigJson));
        const tsconfigMonorepo = mergeOverride(tsconfigMonorepoRaw, overrides?.root);
        const resolvedMonorepo: ResolvedTsconfig = hasMonorepo
            ? monorepoConfig !== undefined
                ? resolveTsconfigConfig(
                      monorepoConfig,
                      cwd,
                      overrides?.root ? { overrides: overrides.root } : {}
                  )
                : resolveTsconfig({
                      tsconfig: monorepoTsconfigPath,
                      root: cwd,
                      cwd,
                      ...(overrides?.root ? { overrides: overrides.root } : {}),
                  })
            : { alias: [], paths: {}, references: [], relativePaths: false };

        const tsconfigRaw = readTsconfig(tsconfigPath) as TsConfigJson;
        const tsconfig = mergeOverride(tsconfigRaw, overrides?.default);

        const tsconfigBuildRaw = tsconfigBuildExists
            ? (readTsconfig(tsconfigBuildPath) as TsConfigJson)
            : undefined;
        const tsconfigBuild = tsconfigBuildRaw
            ? mergeOverride(tsconfigBuildRaw, overrides?.build)
            : undefined;

        const types = enableComposite
            ? [
                  ...new Set([
                      ...(tsconfig.compilerOptions?.types ?? []),
                      ...(tsconfigMonorepo.compilerOptions?.types ?? []),
                  ]),
              ]
            : [];

        const monorepoPaths: Record<string, string[]> = {};
        if (enableAliases) {
            for (const [key, targets] of Object.entries(resolvedMonorepo.paths)) {
                const transformed = targets
                    .map(target => toWorkspacePath(target, dirname, dirnameRelative))
                    .filter((value): value is string => value !== undefined);
                if (transformed.length > 0) monorepoPaths[key] = transformed;
            }
        }

        const references: TsConfigJson.References[] = [];
        if (enableRefs) {
            const seen = new Set<string>();
            const add = (
                absolute: string,
                reference: { path: string; [key: string & {}]: unknown }
            ) => {
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

        const monorepoCompilerOptions = { ...tsconfigMonorepo.compilerOptions };
        delete monorepoCompilerOptions.paths;
        const monorepoRest = { ...tsconfigMonorepo };
        delete monorepoRest.references;
        // Hoist the effective `include` / `exclude` from the extended config
        // chain into the generated file. TypeScript resolves those patterns
        // relative to the config that defined them; a generated file that only
        // `extends` another config can make tools scan the whole tree instead of
        // the workspace's own sources, so write them out (rebased) explicitly.
        const inheritedGlobs = resolveTsconfigFilePatterns(tsconfigPath);
        const hoistedInclude = rebasePatterns(
            tsconfig.include ?? inheritedGlobs.include,
            tsconfig.include !== undefined ? dirname : inheritedGlobs.includeDir,
            dirname
        );
        const hoistedExclude = rebasePatterns(
            tsconfig.exclude ?? inheritedGlobs.exclude,
            tsconfig.exclude !== undefined ? dirname : inheritedGlobs.excludeDir,
            dirname
        );
        const newTsconfig: TsConfigJson = {
            ...(enableComposite ? monorepoRest : {}),
            extends: `./${tsconfigFilename}`,
            ...(hoistedInclude ? { include: hoistedInclude } : {}),
            ...(hoistedExclude ? { exclude: hoistedExclude } : {}),
            compilerOptions: {
                ...(enableComposite ? monorepoCompilerOptions : {}),
                composite: enableComposite,
                ...(types.length ? { types } : {}),
                ...(enableAliases &&
                Object.keys({
                    ...tsconfig.compilerOptions?.paths,
                    ...monorepoPaths,
                }).length > 0
                    ? {
                          paths: {
                              ...tsconfig.compilerOptions?.paths,
                              ...monorepoPaths,
                          },
                      }
                    : {}),
            },
            ...(enableRefs ? { references } : {}),
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
    } catch (e: unknown) {
        // Never exit the host process from library code: a CLI caller can log
        // the error, while `dbx sync` can report it through its normal runner.
        throw new Error(
            `Failed to extend tsconfig for ${dirnameRelative}: ${
                e instanceof Error ? e.message : String(e)
            }`
        );
    }
}

/**
 * Rebase tsconfig `include` / `exclude` patterns from the directory of the
 * config that defined them onto the generated config's directory. Patterns in
 * the same directory are kept verbatim; others become workspace-relative posix
 * paths (glob metacharacters are preserved as literal path text).
 */
function rebasePatterns(
    patterns: string[] | undefined,
    fromDir: string | undefined,
    toDir: string
): string[] | undefined {
    if (!patterns) return undefined;
    if (!fromDir || path.resolve(fromDir) === path.resolve(toDir)) return [...patterns];
    return patterns.map(pattern => {
        if (path.isAbsolute(pattern)) return pattern;
        const absolute = path.resolve(fromDir, pattern);
        const relative = path.relative(toDir, absolute).replace(/\\/g, '/');
        return relative === '' ? '.' : relative;
    });
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
