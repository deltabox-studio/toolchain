#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { parseArgs } from 'node:util';

import { Glob } from 'glob';
import type { TsConfigJson } from 'type-fest';

import {
    deepMerge,
    logger,
    resolveIgnorePatterns,
    sectionConfig,
    sectionEnabled,
    type ToolchainConfig,
    type ToolchainTsconfigConfig,
} from '@deltabox/toolchain/shared';

import {
    autoStatePath,
    buildAutoTsconfig,
    readAutoState,
    type TsconfigAutoState,
} from '../../auto.js';
import { tsconfigFileNames } from '../../files.js';
import { mergeOverride, type TsconfigOverrides } from '../../overrides.js';
import { readTsconfig } from '../../resolve.js';
import { resolveTsconfigWorkspaces, type TsconfigWorkspace } from '../../workspaces.js';
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
    /** Managed file overrides applied before generating each workspace. */
    overrides?: TsconfigOverrides;
    /** Pre-resolved workspaces (project-graph + nested config aware). */
    workspaces?: TsconfigWorkspace[];
    /** In-memory root workspaces tsconfig (auto-wired before generation). */
    monorepoConfig?: TsConfigJson;
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
    const hasWorkspacesTsconfig =
        options.monorepoConfig !== undefined || fs.existsSync(monorepoTsconfigPath);

    const results: GeneratedTsconfigResult[] = [];
    if (options.workspaces) {
        const workspaces = options.workspaces.filter(
            workspace => workspace.enabled && fs.existsSync(workspace.defaultTsconfigPath)
        );
        say(
            hasWorkspacesTsconfig
                ? `Extending ${workspaces.length} tsconfigs with ${monorepoTsconfigPathRelative}...`
                : `Extending ${workspaces.length} tsconfigs (no ${monorepoTsconfigPathRelative})...`
        );
        for (const workspace of workspaces) {
            const workspaceOptions = workspace.options;
            results.push(
                generateTsconfig({
                    cwd,
                    dirname: workspace.dir,
                    tsconfigPath: workspace.defaultTsconfigPath,
                    monorepoTsconfigPath,
                    tsconfigBuildPath: workspace.buildTsconfigPath,
                    targetTsconfigPath: workspace.targetTsconfigPath,
                    targetTsconfigBuildPath: workspace.buildTsconfigPath,
                    indent,
                    aliases: workspaceOptions.aliases !== false,
                    refs: workspaceOptions.refs === true,
                    composite: workspaceOptions.composite === true,
                    ...(options.monorepoConfig ? { monorepoConfig: options.monorepoConfig } : {}),
                    write,
                    log: say,
                    ...(options.overrides ? { overrides: options.overrides } : {}),
                })
            );
        }
    } else {
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
                    ...(options.monorepoConfig ? { monorepoConfig: options.monorepoConfig } : {}),
                    write,
                    log: say,
                    ...(options.overrides ? { overrides: options.overrides } : {}),
                })
            );
        }
    }

    if (!enableReferences && !results.some(result => result.config.references !== undefined)) {
        return results;
    }

    say('Checking for additional tsconfig changes...');
    // A reference may point at a workspace whose generated tsconfig does not
    // exist yet (a fresh checkout, or a workspace just added). Its in-memory
    // result is authoritative for this run, so one sync converges.
    const generatedByPath = new Map(
        results.map(result => [path.resolve(result.targetTsconfigPath), result] as const)
    );
    for (const result of results) {
        const { dirname, dirnameRelative, targetTsconfigPath, config } = result;
        say(`  - ${dirnameRelative}`);

        if (config.references?.length) {
            config.references = config.references.filter(ref => {
                const refTsconfigPath = path.resolve(dirname, ref.path);
                const generated = generatedByPath.get(refTsconfigPath);
                let composite: unknown;
                if (generated) {
                    composite = generated.config.compilerOptions?.composite;
                } else if (fs.existsSync(refTsconfigPath)) {
                    const refTsconfig = readTsconfig(refTsconfigPath);
                    composite = (refTsconfig.compilerOptions as { composite?: unknown } | undefined)
                        ?.composite;
                } else {
                    say(`    tsconfig not found for ${ref.path}, skipping.`);
                    return false;
                }
                const hasCompositeOption = composite !== null && composite !== undefined;
                return hasCompositeOption && composite !== false;
            });
        }

        if (write) {
            fs.writeFileSync(targetTsconfigPath, `${JSON.stringify(config, null, indent)}\n`);
        }
    }

    return results;
}

export interface GenerateWorkspaceTsconfigsOptions {
    /** Repo root (default `process.cwd()`). */
    cwd?: string;
    /** The merged root config. */
    config: ToolchainConfig;
    /** CLI overrides for the `tsconfig` section. */
    overrides?: Partial<ToolchainTsconfigConfig>;
    /** Write the outputs to disk (default true). */
    write?: boolean;
    /** Previous auto state (from the sync manifest); otherwise the sidecar is read. */
    previousAuto?: TsconfigAutoState;
    /** Override the auto sidecar path. */
    autoStateFile?: string;
    /** Write the auto-state sidecar (default true; sync stores it in the manifest instead). */
    writeSidecar?: boolean;
}

export interface GenerateWorkspaceTsconfigsResult {
    results: GeneratedTsconfigResult[];
    workspaces: TsconfigWorkspace[];
    /** The resolved root workspaces tsconfig (auto-wired + root overrides). */
    autoConfig: TsConfigJson;
    /** The auto-wired config before root overrides (the sync base). */
    baseAutoConfig: TsConfigJson;
    /** The keys auto-wiring owns, persisted in the sidecar. */
    autoState: TsconfigAutoState;
    /** Absolute root workspaces tsconfig path. */
    rootTsconfigPath: string;
    /** JSON text for the root workspaces tsconfig. */
    rootContent: string;
    /** JSON text before root overrides. */
    baseRootContent: string;
    /** Absolute auto-state sidecar path. */
    autoStatePath: string;
    /** JSON text for the auto-state sidecar. */
    autoStateContent: string;
    /** Whether the root workspaces tsconfig should be written. */
    writeRoot: boolean;
    /** Whether the auto-state sidecar should be written. */
    writeState: boolean;
    /** True when the `tsconfig` section is disabled/undefined. */
    skipped?: boolean;
}

/**
 * The high-level generator used by `dbx sync` and `dbx tsconfig`: resolves the
 * project graph + nested configs, auto-wires the root workspaces tsconfig, then
 * generates every enabled workspace tsconfig with its own effective switches.
 */
export async function generateWorkspaceTsconfigs(
    options: GenerateWorkspaceTsconfigsOptions
): Promise<GenerateWorkspaceTsconfigsResult> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const rootOptions = deepMerge(
        sectionConfig(options.config.tsconfig) ?? {},
        (options.overrides ?? {}) as Record<string, unknown>
    ) as ToolchainTsconfigConfig;
    const config: ToolchainConfig = { ...options.config, tsconfig: rootOptions };
    const names = tsconfigFileNames(config);
    const rootTsconfigPath = path.resolve(cwd, names.rootFile);
    const autoStateFile = options.autoStateFile ?? autoStatePath(cwd);
    // Respect the config even when called directly (`dbx tsconfig`) or with CLI
    // overrides: an undefined/`false` section means the task is disabled.
    if (!sectionEnabled(options.config.tsconfig)) {
        return {
            results: [],
            workspaces: [],
            autoConfig: {},
            baseAutoConfig: {},
            autoState: { paths: [], references: [] },
            rootTsconfigPath,
            rootContent: '',
            baseRootContent: '',
            autoStatePath: autoStateFile,
            autoStateContent: '{}',
            writeRoot: false,
            writeState: false,
            skipped: true,
        };
    }
    const workspaces = await resolveTsconfigWorkspaces({
        cwd,
        rootConfig: config,
        ...(rootOptions.glob !== undefined ? { glob: rootOptions.glob } : {}),
        ...(rootOptions.exclude !== undefined ? { exclude: rootOptions.exclude } : {}),
        ...(rootOptions.gitignore !== undefined ? { gitignore: rootOptions.gitignore } : {}),
    });
    const existing = fs.existsSync(rootTsconfigPath) ? readTsconfig(rootTsconfigPath) : undefined;
    const previousAuto = options.previousAuto ?? readAutoState(autoStateFile);
    const auto = buildAutoTsconfig(workspaces, { cwd, existing, previous: previousAuto });
    const baseAutoConfig = auto.config;
    const autoConfig = rootOptions.overrides?.root
        ? mergeOverride(baseAutoConfig, rootOptions.overrides.root)
        : baseAutoConfig;
    const indent = rootOptions.indent ?? 4;
    const baseRootContent = `${JSON.stringify(baseAutoConfig, null, indent)}\n`;
    const rootContent = `${JSON.stringify(autoConfig, null, indent)}\n`;
    const autoStateContent = `${JSON.stringify(auto.state, null, indent)}\n`;
    const hasAuto =
        auto.state.paths.length > 0 ||
        auto.state.references.length > 0 ||
        fs.existsSync(rootTsconfigPath) ||
        Boolean(rootOptions.overrides?.root);
    const rootChanged = !isDeepStrictEqual(existing ?? {}, baseAutoConfig);
    const writeState =
        options.writeSidecar !== false &&
        (fs.existsSync(autoStateFile) ||
            auto.state.paths.length > 0 ||
            auto.state.references.length > 0);
    // A nested workspace with its own `tsconfig` section manages its own tree;
    // the root still aliases/references it, but must not overwrite its output.
    const generationWorkspaces = workspaces.filter(
        workspace => workspace.isRoot || !workspace.ownTsconfig
    );
    const results = generateTsconfigs({
        cwd,
        workspaces: generationWorkspaces,
        monorepoConfig: autoConfig,
        monorepoTsconfigFilename: names.rootFile,
        indent,
        write: options.write ?? true,
        log: false,
        ...(rootOptions.overrides
            ? { overrides: { ...rootOptions.overrides, root: undefined } }
            : {}),
    });

    if (options.write !== false) {
        if (hasAuto && rootChanged) {
            fs.mkdirSync(path.dirname(rootTsconfigPath), { recursive: true });
            fs.writeFileSync(rootTsconfigPath, rootContent, 'utf-8');
        }
        if (writeState) {
            fs.mkdirSync(path.dirname(autoStateFile), { recursive: true });
            fs.writeFileSync(autoStateFile, autoStateContent, 'utf-8');
        }
    }

    return {
        results,
        workspaces,
        autoConfig,
        baseAutoConfig,
        autoState: auto.state,
        rootTsconfigPath,
        rootContent,
        baseRootContent,
        autoStatePath: autoStateFile,
        autoStateContent,
        writeRoot: hasAuto && rootChanged,
        writeState,
    };
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
