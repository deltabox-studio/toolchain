import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveFmtCustomGroups } from '@deltabox/toolchain/core';
import {
    biomeToOx,
    dprintToOx,
    eslintToOx,
    findBiomeConfig,
    findDprintConfig,
    findEslintConfig,
    findOxcConfigs,
    findPrettierConfig,
    prettierToOx,
    readJsonc,
} from '@deltabox/toolchain/migrate';
import {
    applyFmtCustomGroups,
    DEFAULT_FMT_RULES,
    DEFAULT_LINT_RULES,
    deepMerge,
    FORMATTER_PRECEDENCE,
    isPlainObject,
    LINTER_PRECEDENCE,
    type ConfigJsonValue,
    type FormatterTool,
    type LinterTool,
    type PackageJson,
    readJsonAt,
    readJsoncAt,
    resolveFmtTools,
    resolveLintTools,
    sectionConfig,
    sectionEnabled,
    type SyncTask,
    type ToolchainConfig,
    type ToolchainFmtConfig,
    type ToolchainLintConfig,
    type ToolchainOxfmtConfig,
    warningMessage,
    type WarningId,
} from '@deltabox/toolchain/shared';

type Json = Record<string, unknown>;

const PACKAGE_TOOLS: Record<string, string[]> = {
    oxfmt: ['oxfmt', '@oxc-project/oxfmt', 'vite-plus'],
    oxlint: ['oxlint', '@oxc-project/oxlint', 'vite-plus'],
    biome: ['@biomejs/biome'],
    prettier: ['prettier'],
    dprint: ['dprint'],
    eslint: ['eslint'],
};

const EXTENSION_TOOLS: Record<string, string> = {
    'oxc.oxc-vscode': 'oxc',
    'biomejs.biome': 'biome',
    'esbenp.prettier-vscode': 'prettier',
    'dprint.dprint': 'dprint',
    'dbaeumer.vscode-eslint': 'eslint',
};

const ACTION_TOOLS: Record<string, string> = {
    'source.fixAll.oxc': 'oxc',
    'source.fixAll.oxlint': 'oxc',
    'quickfix.biome': 'biome',
    'source.fixAll.biome': 'biome',
    'source.organizeImports.biome': 'biome',
    'source.fixAll.eslint': 'eslint',
};

export interface NormalizeToolingOptions {
    cwd: string;
    /** Override the VS Code user `settings.json` path (mainly for tests). */
    vscodeSettingsPath?: string;
}

export interface NormalizedTooling {
    config: ToolchainConfig;
    warnings: WarningId[];
}

/** Directories from `cwd` up to the repo root (`.git`) or filesystem root. */
function directoryChain(cwd: string): string[] {
    const dirs: string[] = [];
    let dir = path.resolve(cwd);
    for (;;) {
        dirs.push(dir);
        if (fs.existsSync(path.join(dir, '.git'))) break;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return dirs;
}

function packageNamesAt(dir: string): Set<string> {
    const names = new Set<string>();
    const pkg = readJsonAt<PackageJson>(dir, 'package.json');
    if (pkg) {
        for (const field of [
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'optionalDependencies',
        ] as const) {
            for (const name of Object.keys(pkg[field] ?? {})) names.add(name);
        }
    }
    return names;
}

function installedToolAt<T extends string>(
    dir: string,
    precedence: readonly T[],
    disabled: ReadonlySet<T>
): T | undefined {
    const names = packageNamesAt(dir);
    return precedence.find(
        tool => !disabled.has(tool) && (PACKAGE_TOOLS[tool] ?? []).some(name => names.has(name))
    );
}

/** Which tool owns a config file in this directory (if any). */
function configFileToolAt<T extends string>(
    dir: string,
    kind: 'fmt' | 'lint',
    precedence: readonly T[],
    disabled: ReadonlySet<T>
): T | undefined {
    const active = new Set<string>();
    if (kind === 'fmt') {
        if (findOxcConfigs(dir).fmt) active.add('oxc');
        if (findBiomeConfig(dir)) active.add('biome');
        if (findPrettierConfig(dir)) active.add('prettier');
        if (findDprintConfig(dir)) active.add('dprint');
    } else {
        if (findOxcConfigs(dir).lint) active.add('oxc');
        if (findBiomeConfig(dir)) active.add('biome');
        if (findEslintConfig(dir)) active.add('eslint');
    }
    return precedence.find(tool => !disabled.has(tool) && active.has(tool));
}

/**
 * Resolve the workspace tool from the nearest directory first. A tool's own
 * config file is a stronger signal than a dependency, so both are checked at
 * each level before walking to the parent.
 */
function workspaceTool<T extends string>(
    cwd: string,
    kind: 'fmt' | 'lint',
    precedence: readonly T[],
    disabled: ReadonlySet<T>
): T | undefined {
    for (const dir of directoryChain(cwd)) {
        const configured = configFileToolAt(dir, kind, precedence, disabled);
        if (configured) return configured;
        const installed = installedToolAt(dir, precedence, disabled);
        if (installed) return installed;
    }
    return undefined;
}

function vscodeSettingsPaths(): string[] {
    const home = os.homedir();
    const appData = process.env.APPDATA;
    if (process.platform === 'win32') {
        return [
            ...(appData
                ? [
                      path.join(appData, 'Code', 'User', 'settings.json'),
                      path.join(appData, 'Code - Insiders', 'User', 'settings.json'),
                      path.join(appData, 'VSCodium', 'User', 'settings.json'),
                  ]
                : []),
            path.join(home, 'AppData', 'Roaming', 'Code', 'User', 'settings.json'),
        ];
    }
    if (process.platform === 'darwin') {
        return [
            path.join(home, 'Library', 'Application Support', 'Code', 'User', 'settings.json'),
            path.join(
                home,
                'Library',
                'Application Support',
                'Code - Insiders',
                'User',
                'settings.json'
            ),
        ];
    }
    return [
        path.join(home, '.config', 'Code', 'User', 'settings.json'),
        path.join(home, '.config', 'Code - Insiders', 'User', 'settings.json'),
        path.join(home, '.config', 'VSCodium', 'User', 'settings.json'),
    ];
}

function readSettings(customPath?: string): Json | undefined {
    const candidates = customPath ? [customPath] : vscodeSettingsPaths();
    for (const file of candidates) {
        if (!fs.existsSync(file)) continue;
        try {
            return readJsonc(file);
        } catch {
            continue;
        }
    }
    return undefined;
}

function editorTool<T extends string>(
    settings: Json | undefined,
    precedence: readonly T[],
    kind: 'fmt' | 'lint',
    disabled: ReadonlySet<T> = new Set()
): T | undefined {
    if (!settings) return undefined;
    const active = new Set<string>();
    const blocks = [settings];
    for (const [key, value] of Object.entries(settings)) {
        if (key.startsWith('[') && isPlainObject(value)) blocks.push(value);
    }
    for (const block of blocks) {
        if (kind === 'fmt') {
            const extension = block['editor.defaultFormatter'];
            if (typeof extension === 'string' && EXTENSION_TOOLS[extension]) {
                active.add(EXTENSION_TOOLS[extension] as string);
            }
        } else {
            const actions = block['editor.codeActionsOnSave'];
            if (isPlainObject(actions)) {
                for (const action of Object.keys(actions)) {
                    if (ACTION_TOOLS[action]) active.add(ACTION_TOOLS[action] as string);
                }
            }
        }
    }
    if (kind === 'lint') {
        if (settings['eslint.enable'] === true) active.add('eslint');
        if (settings['biome.enabled'] === true) active.add('biome');
        if (settings['oxc.enable'] === true) active.add('oxc');
    }
    return precedence.find(tool => !disabled.has(tool) && active.has(tool));
}

function disabledTools<T extends string>(section: unknown, precedence: readonly T[]): Set<T> {
    const options = sectionConfig(section as never) as Json | undefined;
    const out = new Set<T>();
    for (const tool of precedence) if (options?.[tool] === false) out.add(tool);
    return out;
}

function withoutSchema(config: Json): Json {
    const { $schema: _schema, ...rest } = config;
    return rest;
}

function mergeIgnorePatterns(base: Json, overrides: Json): void {
    const ignored = [
        ...(Array.isArray(base.ignorePatterns) ? base.ignorePatterns : []),
        ...(Array.isArray(overrides.ignorePatterns) ? overrides.ignorePatterns : []),
    ];
    if (ignored.length > 0) base.ignorePatterns = [...new Set(ignored)];
}

async function migratedFmtOptions(cwd: string): Promise<Json | undefined> {
    for (const dir of directoryChain(cwd)) {
        const direct = findOxcConfigs(dir).fmt;
        if (direct) return withoutSchema(readJsonc(direct));
    }

    for (const dir of directoryChain(cwd)) {
        const layers: Json[] = [];
        if (findDprintConfig(dir)) {
            const result = await dprintToOx.run({ cwd: dir });
            if (result.oxfmt) layers.push(result.oxfmt);
        }
        if (findPrettierConfig(dir)) {
            const result = await prettierToOx.run({ cwd: dir });
            if (result.oxfmt) layers.push(result.oxfmt);
        }
        if (findBiomeConfig(dir)) {
            const result = await biomeToOx.run({ cwd: dir });
            if (result.oxfmt) layers.push(result.oxfmt);
        }
        if (layers.length > 0)
            return layers.reduce<Json>((acc, layer) => deepMerge(acc, layer), {});
    }
    return undefined;
}

async function migratedLintOptions(cwd: string): Promise<Json | undefined> {
    for (const dir of directoryChain(cwd)) {
        const direct = findOxcConfigs(dir).lint;
        if (direct) return withoutSchema(readJsonc(direct));
    }

    for (const dir of directoryChain(cwd)) {
        const layers: Json[] = [];
        if (findEslintConfig(dir)) {
            const result = await eslintToOx.run({ cwd: dir });
            if (result.oxlint) layers.push(withoutSchema(result.oxlint));
        }
        if (findBiomeConfig(dir)) {
            const result = await biomeToOx.run({ cwd: dir });
            if (result.oxlint) layers.push(withoutSchema(result.oxlint));
        }
        if (layers.length > 0)
            return layers.reduce<Json>((acc, layer) => deepMerge(acc, layer), {});
    }
    return undefined;
}

function hasUserConfigAt(dir: string, kind: 'fmt' | 'lint'): boolean {
    const oxc = findOxcConfigs(dir);
    if (kind === 'fmt') {
        return Boolean(
            oxc.fmt || findBiomeConfig(dir) || findPrettierConfig(dir) || findDprintConfig(dir)
        );
    }
    return Boolean(oxc.lint || findBiomeConfig(dir) || findEslintConfig(dir));
}

function hasUserConfig(cwd: string, kind: 'fmt' | 'lint'): boolean {
    return directoryChain(cwd).some(dir => hasUserConfigAt(dir, kind));
}

function existingConfigOptionsAt(dir: string, tool: string): Json | undefined {
    try {
        if (tool === 'biome') {
            const file = findBiomeConfig(dir);
            if (file) return withoutSchema(readJsonc(file));
        }
        if (tool === 'prettier') return findPrettierConfig(dir)?.config;
        if (tool === 'dprint') return findDprintConfig(dir)?.config;
        if (tool === 'eslint') {
            const found = findEslintConfig(dir);
            if (found?.json) return withoutSchema(readJsonc(found.file));
        }
    } catch {
        return undefined;
    }
    return undefined;
}

function existingConfigOptions(cwd: string, tool: string): Json | undefined {
    for (const dir of directoryChain(cwd)) {
        const options = existingConfigOptionsAt(dir, tool);
        if (options !== undefined) return options;
    }
    return undefined;
}

/** Where the active formatter/linter was selected from. */
export type ToolSource = 'config' | 'project-settings' | 'workspace' | 'user-settings' | 'default';

/** The active tool for one kind, plus where it came from. */
export interface DiscoveredTool<T extends string> {
    tool: T;
    source: ToolSource;
}

/** The active formatter and linter for a project. */
export interface DiscoveredTooling {
    fmt: DiscoveredTool<FormatterTool>;
    lint: DiscoveredTool<LinterTool>;
}

/**
 * Pick the active formatter/linter. An explicitly configured tool wins (in
 * precedence order: oxc > biome > prettier > dprint for fmt, oxc > biome >
 * eslint for lint); otherwise use the same discovery `dbx sync` applies — the
 * project `.vscode/settings.json`, the nearest config file/`package.json`, the
 * VS Code user settings — and fall back to Oxc.
 */
function selectTool<T extends string>(
    config: ToolchainConfig,
    kind: 'fmt' | 'lint',
    precedence: readonly T[],
    options: NormalizeToolingOptions
): DiscoveredTool<T> {
    const section = config[kind];
    // An explicit `fmt: false` / `{ enabled: false }` opts out of discovery.
    if (section !== undefined && !sectionEnabled(section)) {
        return { tool: precedence[0] as T, source: 'default' };
    }
    const configured = kind === 'fmt' ? resolveFmtTools(config) : resolveLintTools(config);
    if (configured.length > 0) {
        return { tool: configured[0] as T, source: 'config' };
    }
    const disabled = disabledTools(section, precedence);
    const projectSettings = readJsoncAt<Json>(options.cwd, '.vscode/settings.json');
    const fromProject = editorTool(projectSettings, precedence, kind, disabled);
    if (fromProject) return { tool: fromProject, source: 'project-settings' };
    const fromWorkspace = workspaceTool(options.cwd, kind, precedence, disabled);
    if (fromWorkspace) return { tool: fromWorkspace, source: 'workspace' };
    const fromUser = editorTool(
        readSettings(options.vscodeSettingsPath),
        precedence,
        kind,
        disabled
    );
    if (fromUser) return { tool: fromUser, source: 'user-settings' };
    return { tool: precedence[0] as T, source: 'default' };
}

/**
 * Resolve the active formatter and linter without migrating any options. This
 * is what `dbx fmt` / `dbx lint` use to decide which tool to run.
 */
export function discoverTooling(
    config: ToolchainConfig = {},
    options: NormalizeToolingOptions
): DiscoveredTooling {
    return {
        fmt: selectTool(config, 'fmt', FORMATTER_PRECEDENCE, options),
        lint: selectTool(config, 'lint', LINTER_PRECEDENCE, options),
    };
}

export async function normalizeToolingConfig(
    config: ToolchainConfig,
    options: NormalizeToolingOptions
): Promise<NormalizedTooling> {
    const warnings: WarningId[] = [];
    let fmt = sectionConfig(config.fmt) as ToolchainFmtConfig | undefined;
    let lint = sectionConfig(config.lint) as ToolchainLintConfig | undefined;
    const names = hasUserConfig(options.cwd, 'fmt');
    const lintNames = hasUserConfig(options.cwd, 'lint');

    if (sectionEnabled(config.fmt) && resolveFmtTools(config).length === 0) {
        const selected = selectTool(config, 'fmt', FORMATTER_PRECEDENCE, options);
        const fallback = selected.source === 'default' && !names;
        if (fallback) warnings.push('fmt.no-tool');
        const next: ToolchainFmtConfig = { ...fmt };
        if (selected.tool === 'oxc') {
            const migrated = await migratedFmtOptions(options.cwd);
            const merged = deepMerge<Json>(DEFAULT_FMT_RULES as Json, migrated ?? {});
            mergeIgnorePatterns(merged, migrated ?? {});
            next.oxc = merged as Record<string, ConfigJsonValue>;
        } else {
            (next as Record<string, unknown>)[selected.tool] =
                existingConfigOptions(options.cwd, selected.tool) ?? {};
        }
        fmt = next;
    }
    if (fmt && isPlainObject(fmt.oxc)) {
        const customGroups = await resolveFmtCustomGroups({ cwd: options.cwd });
        fmt = {
            ...fmt,
            oxc: applyFmtCustomGroups(fmt.oxc as ToolchainOxfmtConfig, customGroups),
        };
    }

    if (sectionEnabled(config.lint) && resolveLintTools(config).length === 0) {
        const selected = selectTool(config, 'lint', LINTER_PRECEDENCE, options);
        const fallback = selected.source === 'default' && !lintNames;
        if (fallback) warnings.push('lint.no-tool');
        const next: ToolchainLintConfig = { ...lint };
        if (selected.tool === 'oxc') {
            const migrated = await migratedLintOptions(options.cwd);
            const merged = deepMerge<Json>(DEFAULT_LINT_RULES as Json, migrated ?? {});
            mergeIgnorePatterns(merged, migrated ?? {});
            next.oxc = merged as Record<string, ConfigJsonValue>;
        } else {
            (next as Record<string, unknown>)[selected.tool] =
                existingConfigOptions(options.cwd, selected.tool) ?? {};
        }
        lint = next;
    }

    return {
        config: {
            ...config,
            ...(fmt !== undefined ? { fmt } : {}),
            ...(lint !== undefined ? { lint } : {}),
        },
        warnings,
    };
}

export interface ToolingDefaultsTaskOptions {
    vscodeSettingsPath?: string;
}

export function toolingDefaultsTask(options: ToolingDefaultsTaskOptions = {}): SyncTask {
    return {
        name: 'tooling-defaults',
        enabled: config => sectionEnabled(config.fmt) || sectionEnabled(config.lint),
        run: async ctx => {
            const fmtExplicit = resolveFmtTools(ctx.config).length > 0;
            const lintExplicit = resolveLintTools(ctx.config).length > 0;
            const result = await normalizeToolingConfig(ctx.config, {
                cwd: ctx.cwd,
                ...(options.vscodeSettingsPath
                    ? { vscodeSettingsPath: options.vscodeSettingsPath }
                    : {}),
            });
            Object.assign(ctx.config, result.config);
            for (const id of result.warnings) ctx.warn(warningMessage(id), id);

            const own = ctx.ownConfig;
            if (own && own !== ctx.config) {
                const ownFmtShorthand =
                    sectionEnabled(own.fmt) && resolveFmtTools(own).length === 0;
                const ownLintShorthand =
                    sectionEnabled(own.lint) && resolveLintTools(own).length === 0;
                if ((ownFmtShorthand && !fmtExplicit) || (ownLintShorthand && !lintExplicit)) {
                    const ownResult = await normalizeToolingConfig(own, {
                        cwd: ctx.cwd,
                        ...(options.vscodeSettingsPath
                            ? { vscodeSettingsPath: options.vscodeSettingsPath }
                            : {}),
                    });
                    Object.assign(own, ownResult.config);
                }
            }
            return [];
        },
    };
}
