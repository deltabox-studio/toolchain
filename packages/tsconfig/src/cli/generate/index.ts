#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parseArgs } from 'node:util';

import { Glob } from 'glob';
import type { TsConfigJson } from 'type-fest';

import {
    deepMerge,
    logger,
    readJsonFile,
    resolveIgnorePatterns,
    sectionConfig,
    sectionEnabled,
    type ToolchainConfig,
    type ToolchainTsconfigConfig,
    warningMessage,
} from '@deltabox/toolchain/shared';

import {
    autoStatePath,
    buildAutoTsconfig,
    buildRootWorkspacesBaseline,
    readAutoState,
    type TsconfigAutoState,
} from '../../auto.js';
import { tsconfigFileNames } from '../../files.js';
import {
    hasOverrideKeys,
    isAppliedOverride,
    mergeOverride,
    reconcileOverride,
} from '../../overrides.js';
import {
    parseTsconfig,
    readTsconfig,
    prefetchTsconfigExtends,
    type TsconfigContents,
} from '../../resolve/index.js';
import {
    deleteSnapshot,
    detectIndent,
    getSnapshot,
    setSnapshot,
    type SnapshotTree,
    stringifyTsconfig,
    TSCONFIG_MANIFEST_PATH,
    toRepoRelative,
} from '../../snapshots.js';
import type { OverridesState, TsconfigOverrides } from '../../types/index.js';
import {
    resolveAutoSwitches,
    resolveTsconfigWorkspaces,
    type TsconfigWorkspace,
} from '../../workspaces.js';
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
    /** Inline compiler options inherited from a remote `extends` chain (default false). */
    flattenRemoteExtends?: boolean;
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
    /** In-memory contents (absolute path -> JSONC) that win over files on disk. */
    fileContents?: TsconfigContents;
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
            const switches = resolveAutoSwitches(workspaceOptions as Record<string, unknown>);
            const refsEnabled =
                workspaceOptions.refs === true ||
                (workspaceOptions.refs !== false && switches.refsAuto.enabled);
            // `composite` is dynamic: project references require it, and
            // `refs`/`refsAuto` decide whether they are wired. Only when both
            // are disabled does the workspaces tsconfig value apply (the
            // generator falls back to it).
            const composite = refsEnabled ? true : workspaceOptions.composite;
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
                    refs: refsEnabled,
                    flattenRemoteExtends: workspaceOptions.flattenRemoteExtends === true,
                    ...(composite !== undefined ? { composite } : {}),
                    ...(options.monorepoConfig ? { monorepoConfig: options.monorepoConfig } : {}),
                    write,
                    log: say,
                    ...(options.overrides ? { overrides: options.overrides } : {}),
                    ...(options.fileContents ? { fileContents: options.fileContents } : {}),
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
                    flattenRemoteExtends: options.flattenRemoteExtends === true,
                    ...(options.monorepoConfig ? { monorepoConfig: options.monorepoConfig } : {}),
                    write,
                    log: say,
                    ...(options.overrides ? { overrides: options.overrides } : {}),
                    ...(options.fileContents ? { fileContents: options.fileContents } : {}),
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
                const refTarget = path.resolve(dirname, ref.path);
                // TypeScript accepts a project reference to a directory that
                // holds a `tsconfig.json` (the common form). Normalize it to
                // the file so the in-memory results and disk can be inspected.
                const refTsconfigPath =
                    fs.existsSync(refTarget) && fs.statSync(refTarget).isDirectory()
                        ? path.join(refTarget, 'tsconfig.json')
                        : refTarget;
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
            if (config.references.length === 0) delete config.references;
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
    /** In-memory contents (absolute path -> JSONC) that win over files on disk. */
    fileContents?: TsconfigContents;
    /**
     * Apply `tsconfig.overrides` while generating (default true). A caller that
     * already patched the contents passed via `fileContents` disables this so
     * the same override is not applied twice (and a removed one stays removed).
     */
    applyOverrides?: boolean;
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
    // Download remote `extends` chains before the synchronous resolver runs. A
    // build config may point at a managed `tsconfig.json` generated this run.
    // Bare package specifiers inside a remote config resolve from the directory
    // of the local file that introduced them, exactly like the resolver: in an
    // isolated (pnpm) install a workspace's dependency is not visible from cwd.
    const prefetchFiles = [
        ...(fs.existsSync(rootTsconfigPath) ? [rootTsconfigPath] : []),
        ...workspaces
            .filter(workspace => workspace.enabled)
            .flatMap(workspace => [
                ...(fs.existsSync(workspace.defaultTsconfigPath)
                    ? [workspace.defaultTsconfigPath]
                    : []),
                ...(fs.existsSync(workspace.buildTsconfigPath)
                    ? [workspace.buildTsconfigPath]
                    : []),
            ]),
    ];
    const assumeFiles = workspaces.map(workspace => workspace.targetTsconfigPath);
    for (const file of prefetchFiles) {
        await prefetchTsconfigExtends([file], {
            packageDir: path.dirname(file),
            assumeFiles,
        });
    }
    const injectedRoot = options.fileContents
        ? options.fileContents instanceof Map
            ? options.fileContents.get(path.resolve(rootTsconfigPath))
            : (options.fileContents as Record<string, string>)[path.resolve(rootTsconfigPath)]
        : undefined;
    const existingPathExists = injectedRoot !== undefined || fs.existsSync(rootTsconfigPath);
    // Only restore a missing workspaces file when there is something to wire:
    // an empty project must stay empty (and `sync --check` quiet).
    const rootMissing =
        !existingPathExists && workspaces.some(workspace => workspace.enabled && !workspace.isRoot);
    const existing =
        injectedRoot !== undefined
            ? (parseTsconfig(injectedRoot) as TsConfigJson)
            : existingPathExists
              ? readTsconfig(rootTsconfigPath)
              : rootMissing
                ? buildRootWorkspacesBaseline(workspaces, cwd, path.dirname(rootTsconfigPath))
                : undefined;
    const previousAuto = options.previousAuto ?? readAutoState(autoStateFile);
    const auto = buildAutoTsconfig(workspaces, {
        cwd,
        baseDir: path.dirname(rootTsconfigPath),
        existing,
        previous: previousAuto,
    });
    const baseAutoConfig = auto.config;
    const indent = rootOptions.indent ?? 4;
    const nextRootOverride = rootOptions.overrides?.root;
    // A direct CLI write must record what the root file held before the root
    // override (and reuse it on later runs) so the override can be reverted.
    // A sync passes `write: false` and reconciles the root through its own
    // manifest-aware target instead.
    let autoConfig = baseAutoConfig;
    let rootReconciled = false;
    let manifestFile: string | undefined;
    let manifest: Record<string, unknown> | undefined;
    const rootRelative = toRepoRelative(cwd, rootTsconfigPath);
    const manifestPath = path.join(cwd, TSCONFIG_MANIFEST_PATH);
    if (
        options.applyOverrides !== false &&
        options.write !== false &&
        rootRelative &&
        (hasOverrideKeys(nextRootOverride) || fs.existsSync(manifestPath))
    ) {
        const stored = fs.existsSync(manifestPath)
            ? (readJsonFile<Record<string, unknown>>(manifestPath) ?? {})
            : {};
        const state = (stored.tsconfigOverrides ?? {}) as OverridesState;
        const snapshots = (stored.snapshots ?? {}) as SnapshotTree;
        const previous = isAppliedOverride(state[rootRelative]) ? state[rootRelative] : undefined;
        if (previous || hasOverrideKeys(nextRootOverride)) {
            const reconciled = reconcileOverride({
                before: baseAutoConfig as Record<string, unknown>,
                ...(previous ? { previous } : {}),
                ...(hasOverrideKeys(nextRootOverride) ? { next: nextRootOverride } : {}),
                ...(getSnapshot(snapshots, rootRelative) !== undefined
                    ? { snapshot: getSnapshot(snapshots, rootRelative) }
                    : {}),
            });
            for (const key of reconciled.kept) {
                logger.warn(
                    warningMessage('tsconfig.override-edited', { file: rootRelative, key }),
                    'tsconfig.override-edited'
                );
            }
            autoConfig = reconciled.data as TsConfigJson;
            rootReconciled = true;
            if (reconciled.snapshot) setSnapshot(snapshots, rootRelative, reconciled.snapshot);
            else deleteSnapshot(snapshots, rootRelative);
            if (hasOverrideKeys(nextRootOverride)) {
                state[rootRelative] = {
                    kind: 'root',
                    override: structuredClone(nextRootOverride) as TsConfigJson,
                };
            } else {
                delete state[rootRelative];
            }
            if (Object.keys(state).length > 0) stored.tsconfigOverrides = state;
            else delete stored.tsconfigOverrides;
            if (Object.keys(snapshots).length > 0) stored.snapshots = snapshots;
            else delete stored.snapshots;
            manifestFile = manifestPath;
            manifest = stored;
        }
    }
    // A dry run (or a sync's first pass) still sees the configured override.
    if (!rootReconciled && options.applyOverrides !== false && hasOverrideKeys(nextRootOverride)) {
        autoConfig = mergeOverride(autoConfig, nextRootOverride);
    }
    const baseRootContent = `${JSON.stringify(baseAutoConfig, null, indent)}\n`;
    const rootContent = `${JSON.stringify(autoConfig, null, indent)}\n`;
    const autoStateContent = `${JSON.stringify(auto.state, null, indent)}\n`;
    const hasAuto =
        rootMissing ||
        auto.state.paths.length > 0 ||
        auto.state.references.length > 0 ||
        fs.existsSync(rootTsconfigPath) ||
        Boolean(nextRootOverride);
    const rootChanged = !isDeepStrictEqual(existing ?? {}, autoConfig);
    const shouldWriteRoot = rootMissing || (hasAuto && rootChanged);
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
        ...(options.applyOverrides !== false && rootOptions.overrides
            ? { overrides: { ...rootOptions.overrides, root: undefined } }
            : {}),
        ...(options.fileContents ? { fileContents: options.fileContents } : {}),
    });

    if (options.write !== false) {
        if (shouldWriteRoot) {
            fs.mkdirSync(path.dirname(rootTsconfigPath), { recursive: true });
            fs.writeFileSync(rootTsconfigPath, rootContent, 'utf-8');
        }
        if (writeState) {
            fs.mkdirSync(path.dirname(autoStateFile), { recursive: true });
            fs.writeFileSync(autoStateFile, autoStateContent, 'utf-8');
        }
        if (manifestFile && manifest) {
            fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
            const existingManifest = fs.existsSync(manifestFile)
                ? fs.readFileSync(manifestFile, 'utf-8')
                : '';
            fs.writeFileSync(
                manifestFile,
                stringifyTsconfig(manifest, detectIndent(existingManifest)),
                'utf-8'
            );
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
        writeRoot: shouldWriteRoot,
        writeState,
    };
}

/**
 * Parse the `--indent` value as a non-negative integer. `Number.parseInt`
 * would silently turn `garbage` into `NaN` (minified JSON) and `2px` into `2`.
 */
export function parseTsconfigIndent(value: string | number | undefined, fallback = 4): number {
    if (value === undefined) return fallback;
    const text = String(value).trim();
    if (!/^\d+$/.test(text)) {
        throw new Error(`invalid --indent "${text}" (expected a non-negative integer).`);
    }
    return Number(text);
}

/** CLI entry (used by the `tsconfig` command). */
export function runTsconfigCli(argv: string[] = process.argv.slice(2)): void {
    const { values: options } = parseArgs({
        args: argv,
        options: {
            aliases: { type: 'boolean', short: 'a', default: true },
            composite: { type: 'boolean', short: 'c', default: false },
            refs: { type: 'boolean', short: 'r', default: false },
            'flatten-remote-extends': { type: 'boolean', default: false },
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
        // Project references require `composite`; derive it from --refs just
        // like the main `dbx tsconfig` command does.
        composite: options.composite || options.refs,
        refs: options.refs,
        flattenRemoteExtends: options['flatten-remote-extends'],
        indent: parseTsconfigIndent(options.indent),
        ...(options.glob ? { glob: options.glob } : {}),
        ...(options.exclude ? { exclude: options.exclude } : {}),
        gitignore: options.gitignore,
        ...(options['default-file'] ? { defaultFile: options['default-file'] } : {}),
        ...(options['build-file'] ? { buildFile: options['build-file'] } : {}),
        ...(options['root-file'] ? { monorepoTsconfigFilename: options['root-file'] } : {}),
    });
}
