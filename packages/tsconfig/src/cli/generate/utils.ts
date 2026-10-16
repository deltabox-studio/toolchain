import fs from 'node:fs';
import path from 'node:path';

import type { TsConfigJson } from 'type-fest';

import { logger } from '@deltabox/toolchain-shared';

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
    } = options;

    const dirnameRelative = path.relative(cwd, dirname).replace(/\\/g, '/') || '.';

    try {
        if (!fs.existsSync(tsconfigPath)) {
            throw new Error(`Source tsconfig not found: ${tsconfigPath}`);
        }

        if (!monorepoTsconfigPath) {
            throw new Error(`options.monorepoTsconfigPath not set for ${tsconfigPath}`);
        }

        if (!fs.existsSync(monorepoTsconfigPath)) {
            throw new Error(`Root 'tsconfig.monorepo.json' not found: ${monorepoTsconfigPath}`);
        }

        logger.info(`  - ${dirnameRelative}`);

        const tsconfigFilename = path.basename(tsconfigPath);

        const tsconfigBuildExists = fs.existsSync(tsconfigBuildPath);

        const tsconfigMonorepo = JSON.parse(
            fs.readFileSync(monorepoTsconfigPath, 'utf-8')
        ) as TsConfigJson;

        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8')) as TsConfigJson;

        const tsconfigBuild = tsconfigBuildExists
            ? (JSON.parse(fs.readFileSync(tsconfigBuildPath, 'utf-8')) as TsConfigJson)
            : undefined;

        const types = disableComposite
            ? []
            : [
                  ...new Set([
                      ...(tsconfig.compilerOptions?.types ?? []),
                      ...(disableComposite ? [] : (tsconfigMonorepo.compilerOptions?.types ?? [])),
                  ]),
              ];

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
                              ...(tsconfigMonorepo.compilerOptions?.paths
                                  ? Object.fromEntries(
                                        Object.entries(
                                            tsconfigMonorepo.compilerOptions.paths
                                        ).reduce(
                                            (acc, pair) => {
                                                const [key, value] = pair;
                                                let skip = true;
                                                const values = value.map(v =>
                                                    transformPath(v, dirname)
                                                );
                                                const newValue: string[] = [];
                                                for (const {
                                                    newPath,
                                                    isRoot,
                                                    inRootDir,
                                                } of values) {
                                                    if (isRoot || inRootDir) {
                                                        if (!/^.$/.test(dirnameRelative)) {
                                                            continue;
                                                        }
                                                    }
                                                    skip = false;
                                                    newValue.push(newPath);
                                                }
                                                return skip ? acc : acc.concat([[key, newValue]]);
                                            },
                                            [] as [string, string[]][]
                                        )
                                    )
                                  : {}),
                          },
                      }),
            },
            ...(ignoreReferences
                ? {}
                : {
                      references: (tsconfig.references ?? [])
                          .concat(tsconfigMonorepo.references ?? [])
                          .reduce((acc, ref) => {
                              if (acc.find(r => r.path === ref.path)) return acc;
                              const { newPath, isRoot, inRootDir } = transformPath(
                                  ref.path,
                                  dirname
                              );
                              const skip = isRoot || inRootDir;
                              return skip && !/^.$/.test(dirnameRelative)
                                  ? acc
                                  : acc.concat([{ ...ref, path: newPath }]);
                          }, [] as TsConfigJson.References[]),
                  }),
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
            originalConfig: tsconfig,
            tsconfigMonorepo,
            tsconfigBuild,
        };
    } catch (e: any) {
        logger.error(`  Failed to extend tsconfig for ${dirnameRelative} due to: ${e}`);
        process.exit(1);
    }
}

function transformPath(sourcePath: string, dirname: string) {
    const segments = sourcePath.split('/');
    if (!segments.length) return { isRoot: false, newPath: sourcePath };

    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) return { isRoot: false, newPath: sourcePath };

    const valueBasename = path.basename(sourcePath);
    const valueDirname = path.dirname(sourcePath);

    let isRoot = false;
    let inRootDir = false;

    let newPath = path
        .join(path.relative(dirname, valueDirname), valueBasename)
        .replace(/\\/g, '/');

    newPath = !newPath.startsWith('.') ? `./${newPath}` : newPath;

    const newPathDirname = path.dirname(path.resolve(dirname, newPath));
    if (dirname === newPathDirname) isRoot = true;
    if (newPathDirname.startsWith(dirname)) inRootDir = true;

    return { isRoot, inRootDir, newPath, newPathDirname };
}
