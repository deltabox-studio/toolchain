#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { Glob } from 'glob';
import type { TsConfigJson } from 'type-fest';

import { type GeneratedTsconfigResult, generateTsconfig } from './utils.js';

export interface GenerateTsconfigsOptions {
    /** The repo root to scan (default `process.cwd()`). */
    cwd?: string;
    /** Inject path aliases from the monorepo config (default true). */
    aliases?: boolean;
    /** Emit `composite: true` + project references (default false). */
    composite?: boolean;
    /** Wire project references between workspaces (default false). */
    refs?: boolean;
    /** JSON indentation (default 4). */
    indent?: number;
    /** The glob for the workspace `tsconfig.default.json` files. */
    glob?: string;
    /** The glob for "override" (app) workspaces. */
    appGlob?: string;
    /** The monorepo tsconfig file name (default `tsconfig.monorepo.json`). */
    monorepoTsconfigFilename?: string;
    /** Log progress (default true). */
    log?: boolean;
    /** Write the generated files to disk (default true; false for a dry run). */
    write?: boolean;
}

/**
 * Extend every workspace `tsconfig.default.json` into a generated
 * `tsconfig.json` (and rewrite its `tsconfig.build.json`), optionally wiring
 * path aliases + project references from `tsconfig.monorepo.json`.
 */
export function generateTsconfigs(
    options: GenerateTsconfigsOptions = {}
): GeneratedTsconfigResult[] {
    const {
        aliases: enableAliases = true,
        composite: enableComposite = false,
        refs: enableReferences = false,
        indent = 4,
        glob = '**/tsconfig.default.json',
        appGlob = 'apps/**/tsconfig.default.json',
        monorepoTsconfigFilename = 'tsconfig.monorepo.json',
        log = true,
        write = true,
    } = options;
    const cwd = options.cwd ?? process.cwd();
    const say = (message: string) => {
        if (log) console.log(message);
    };

    if (!enableAliases) say('Ignoring path aliases for all tsconfigs...');
    if (!enableComposite) say('Disabling compilerOptions.composite for all tsconfigs...');
    if (!enableReferences) say('Ignoring project references for all tsconfigs...');

    const monorepoTsconfigPath = path.resolve(cwd, monorepoTsconfigFilename);
    const monorepoTsconfigPathRelative = path.relative(cwd, monorepoTsconfigPath);

    const tsconfigPaths = new Glob(glob, { cwd, withFileTypes: true }).walkSync();
    const overrides = new Glob(appGlob, { cwd, withFileTypes: true })
        .walkSync()
        .map(x => x.fullpath());

    say(`Extending ${tsconfigPaths.length} tsconfigs with ${monorepoTsconfigPathRelative}...`);

    const results: GeneratedTsconfigResult[] = [];
    for (const tsconfigPath of tsconfigPaths) {
        const fullPath = tsconfigPath.fullpath();
        const dirname = path.dirname(fullPath);
        const isOverride = enableReferences && overrides.some(x => x === fullPath);

        results.push(
            generateTsconfig({
                cwd,
                dirname,
                tsconfigPath: fullPath,
                monorepoTsconfigPath,
                tsconfigBuildPath: path.resolve(dirname, 'tsconfig.build.json'),
                targetTsconfigPath: path.resolve(dirname, 'tsconfig.json'),
                targetTsconfigBuildPath: path.resolve(dirname, 'tsconfig.build.json'),
                indent,
                disableComposite: !enableComposite || isOverride,
                ignoreAliases: !enableAliases,
                ignoreReferences: !enableReferences,
                write,
            })
        );
    }

    if (!enableReferences) return results;

    say('Checking for additional tsconfig changes...');
    for (const result of results) {
        const { dirname, dirnameRelative, tsconfigPath, targetTsconfigPath, config } = result;
        say(`  - ${dirnameRelative}`);

        const isOverride = overrides.some(x => x === tsconfigPath);
        if (isOverride) continue;

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
                const hasCompositeOption = refTsconfig.compilerOptions?.composite != null;
                const compositeDisabled =
                    !hasCompositeOption || refTsconfig.compilerOptions?.composite === false;
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
        },
    });

    generateTsconfigs({
        aliases: options.aliases,
        composite: options.composite,
        refs: options.refs,
        indent: Number.parseInt(options.indent, 10),
    });
}

// Run only when executed directly.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    try {
        runTsconfigCli();
    } catch (e) {
        console.error('Failed to generate tsconfigs due to:', e);
        process.exit(1);
    }
}
