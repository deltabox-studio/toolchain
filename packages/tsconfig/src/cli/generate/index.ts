#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { Glob } from 'glob';
import type { TsConfigJson } from 'type-fest';

import { logger, resolveIgnorePatterns } from '@deltabox/toolchain-shared';

import { type GeneratedTsconfigResult, generateTsconfig } from './utils.js';

export interface GenerateTsconfigsOptions {
    /** The repo root to scan (default `process.cwd()`). */
    cwd?: string;
    /** Inject path aliases from the workspaces config (default true). */
    aliases?: boolean;
    /** Emit `composite: true` + project references (default false). */
    composite?: boolean;
    /** Wire project references between workspaces (default false). */
    refs?: boolean;
    /** JSON indentation (default 4). */
    indent?: number;
    /** The glob(s) for the workspace default tsconfig files. */
    glob?: string | string[];
    /** Extra glob(s) to exclude from `glob` (on top of the common ignored paths). */
    exclude?: string | string[];
    /** Respect `.gitignore` files (default true). */
    gitignore?: boolean;
    /** The workspace default tsconfig file name (default `tsconfig.default.json`). */
    defaultFile?: string;
    /** The workspace build tsconfig file name (default `tsconfig.build.json`). */
    buildFile?: string;
    /** The workspaces tsconfig file name (default `tsconfig.workspaces.json`). */
    monorepoTsconfigFilename?: string;
    /** Log progress (default true). */
    log?: boolean;
    /** Write the generated files to disk (default true; false for a dry run). */
    write?: boolean;
}

/**
 * Extend every workspace default tsconfig (`tsconfig.default.json`) into a
 * generated `tsconfig.json`, optionally wiring path aliases + project references
 * from the workspaces tsconfig (`tsconfig.workspaces.json`). Both the workspaces
 * tsconfig and each workspace's `tsconfig.build.json` are optional.
 */
export function generateTsconfigs(
    options: GenerateTsconfigsOptions = {}
): GeneratedTsconfigResult[] {
    const {
        aliases: enableAliases = true,
        composite: enableComposite = false,
        refs: enableReferences = false,
        indent = 4,
        gitignore = true,
        defaultFile = 'tsconfig.default.json',
        buildFile = 'tsconfig.build.json',
        monorepoTsconfigFilename = 'tsconfig.workspaces.json',
        log = true,
        write = true,
    } = options;
    const glob = options.glob ?? `**/${defaultFile}`;
    const cwd = options.cwd ?? process.cwd();
    const say = (message: string) => {
        if (log) logger.info(message);
    };

    if (!enableAliases) say('Ignoring path aliases for all tsconfigs...');
    if (!enableComposite) say('Disabling compilerOptions.composite for all tsconfigs...');
    if (!enableReferences) say('Ignoring project references for all tsconfigs...');

    const monorepoTsconfigPath = path.resolve(cwd, monorepoTsconfigFilename);
    const monorepoTsconfigPathRelative = path.relative(cwd, monorepoTsconfigPath);
    const hasWorkspacesTsconfig = fs.existsSync(monorepoTsconfigPath);

    // Support negation patterns (`!...`) in the glob list, eg.
    // `['**/tsconfig.default.json', '!**/src/templates/**']`, plus the
    // `exclude` globs, the common ignored paths and (optionally) `.gitignore`.
    const patterns = Array.isArray(glob) ? glob : [glob];
    const include = patterns.filter(pattern => !pattern.startsWith('!'));
    const ignore = [
        ...patterns.filter(pattern => pattern.startsWith('!')).map(pattern => pattern.slice(1)),
        ...resolveIgnorePatterns(cwd, {
            ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
            gitignore,
        }),
    ];
    const tsconfigPaths = new Glob(include.length ? include : [`**/${defaultFile}`], {
        cwd,
        withFileTypes: true,
        ignore,
    }).walkSync();

    say(
        hasWorkspacesTsconfig
            ? `Extending ${tsconfigPaths.length} tsconfigs with ${monorepoTsconfigPathRelative}...`
            : `Extending ${tsconfigPaths.length} tsconfigs (no ${monorepoTsconfigPathRelative})...`
    );

    const results: GeneratedTsconfigResult[] = [];
    for (const tsconfigPath of tsconfigPaths) {
        const fullPath = tsconfigPath.fullpath();
        const dirname = path.dirname(fullPath);

        results.push(
            generateTsconfig({
                cwd,
                dirname,
                tsconfigPath: fullPath,
                monorepoTsconfigPath,
                tsconfigBuildPath: path.resolve(dirname, buildFile),
                targetTsconfigPath: path.resolve(dirname, 'tsconfig.json'),
                targetTsconfigBuildPath: path.resolve(dirname, buildFile),
                indent,
                disableComposite: !enableComposite,
                ignoreAliases: !enableAliases,
                ignoreReferences: !enableReferences,
                write,
            })
        );
    }

    if (!enableReferences) return results;

    say('Checking for additional tsconfig changes...');
    for (const result of results) {
        const { dirname, dirnameRelative, targetTsconfigPath, config } = result;
        say(`  - ${dirnameRelative}`);

        if (config.references?.length) {
            config.references = config.references.filter(ref => {
                const refTsconfigPath = path.resolve(dirname, ref.path);
                if (!fs.existsSync(refTsconfigPath)) {
                    say(`    tsconfig not found for ${ref.path}, skipping.`);
                    return false;
                }
                const refTsconfig = JSON.parse(
                    fs.readFileSync(refTsconfigPath, 'utf-8')
                ) as TsConfigJson;
                const composite = refTsconfig.compilerOptions?.composite;
                const hasCompositeOption = composite !== null && composite !== undefined;
                const compositeDisabled = !hasCompositeOption || composite === false;
                return !compositeDisabled;
            });
        }

        if (write) {
            fs.writeFileSync(targetTsconfigPath, `${JSON.stringify(config, null, indent)}\n`);
        }
    }

    return results;
}

/** CLI entry (used by the `tsconfig` command). */
export function runTsconfigCli(argv: string[] = process.argv.slice(2)): void {
    const { values: options } = parseArgs({
        args: argv,
        options: {
            aliases: { type: 'boolean', short: 'a', default: true },
            composite: { type: 'boolean', short: 'c', default: false },
            refs: { type: 'boolean', short: 'r', default: false },
            indent: { type: 'string', short: 'i', default: '4' },
            glob: { type: 'string', multiple: true },
            exclude: { type: 'string', multiple: true },
            gitignore: { type: 'boolean', default: true },
            'default-file': { type: 'string' },
            'build-file': { type: 'string' },
            'root-file': { type: 'string' },
        },
    });

    generateTsconfigs({
        aliases: options.aliases,
        composite: options.composite,
        refs: options.refs,
        indent: Number.parseInt(options.indent, 10),
        ...(options.glob ? { glob: options.glob } : {}),
        ...(options.exclude ? { exclude: options.exclude } : {}),
        gitignore: options.gitignore,
        ...(options['default-file'] ? { defaultFile: options['default-file'] } : {}),
        ...(options['build-file'] ? { buildFile: options['build-file'] } : {}),
        ...(options['root-file'] ? { monorepoTsconfigFilename: options['root-file'] } : {}),
    });
}

// Run only when executed directly (not when imported by the toolchain, and not
// when this module is inlined into a single-file bundle where `import.meta.url`
// resolves to the bundle rather than to this file).
if (
    /[\\/]generate[\\/]index\.[cm]?[jt]s$/.test(fileURLToPath(import.meta.url)) &&
    import.meta.url === pathToFileURL(process.argv[1] ?? '').href
) {
    try {
        runTsconfigCli();
    } catch (e) {
        logger.error(`Failed to generate tsconfigs due to: ${e}`);
        process.exit(1);
    }
}
