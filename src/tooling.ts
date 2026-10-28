import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
} from '@deltabox/toolchain-migrate';
import {
    DEFAULT_FMT_RULES,
    DEFAULT_LINT_RULES,
    deepMerge,
    FORMATTER_PRECEDENCE,
    isPlainObject,
    LINTER_PRECEDENCE,
    type PackageJson,
    readJsonAt,
    resolveFmtTools,
    resolveLintTools,
    sectionConfig,
    sectionEnabled,
    type SyncTask,
    type ToolchainConfig,
    type ToolchainFmtConfig,
    type ToolchainLintConfig,
    warningMessage,
    type WarningId,
} from '@deltabox/toolchain-shared';

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

function packageNames(cwd: string): Set<string> {
    const names = new Set<string>();
    let dir = path.resolve(cwd);
    for (;;) {
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
        if (fs.existsSync(path.join(dir, '.git'))) break;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return names;
}

function installedTool<T extends string>(
    cwd: string,
    precedence: readonly T[],
    disabled: ReadonlySet<T>
): T | undefined {
    const names = packageNames(cwd);
    return precedence.find(
        tool => !disabled.has(tool) && (PACKAGE_TOOLS[tool] ?? []).some(name => names.has(name))
    );
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
    kind: 'fmt' | 'lint'
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
    return precedence.find(tool => active.has(tool));
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
    const direct = findOxcConfigs(cwd).fmt;
    if (direct) return withoutSchema(readJsonc(direct));

    const layers: Json[] = [];
    if (findDprintConfig(cwd)) {
        const result = await dprintToOx.run({ cwd });
        if (result.oxfmt) layers.push(result.oxfmt);
    }
    if (findPrettierConfig(cwd)) {
        const result = await prettierToOx.run({ cwd });
        if (result.oxfmt) layers.push(result.oxfmt);
    }
    if (findBiomeConfig(cwd)) {
        const result = await biomeToOx.run({ cwd });
        if (result.oxfmt) layers.push(result.oxfmt);
    }
    if (layers.length === 0) return undefined;
    return layers.reduce<Json>((acc, layer) => deepMerge(acc, layer), {});
}

async function migratedLintOptions(cwd: string): Promise<Json | undefined> {
    const direct = findOxcConfigs(cwd).lint;
    if (direct) return withoutSchema(readJsonc(direct));

    const layers: Json[] = [];
    if (findEslintConfig(cwd)) {
        const result = await eslintToOx.run({ cwd });
        if (result.oxlint) layers.push(withoutSchema(result.oxlint));
    }
    if (findBiomeConfig(cwd)) {
        const result = await biomeToOx.run({ cwd });
        if (result.oxlint) layers.push(withoutSchema(result.oxlint));
    }
    if (layers.length === 0) return undefined;
    return layers.reduce<Json>((acc, layer) => deepMerge(acc, layer), {});
}

function hasUserConfig(cwd: string, kind: 'fmt' | 'lint'): boolean {
    const oxc = findOxcConfigs(cwd);
    if (kind === 'fmt') {
        return Boolean(
            oxc.fmt || findBiomeConfig(cwd) || findPrettierConfig(cwd) || findDprintConfig(cwd)
        );
    }
    return Boolean(oxc.lint || findBiomeConfig(cwd) || findEslintConfig(cwd));
}

function existingConfigOptions(cwd: string, tool: string): Json | undefined {
    try {
        if (tool === 'biome') {
            const file = findBiomeConfig(cwd);
            if (file) return withoutSchema(readJsonc(file));
        }
        if (tool === 'prettier') return findPrettierConfig(cwd)?.config;
        if (tool === 'dprint') return findDprintConfig(cwd)?.config;
        if (tool === 'eslint') {
            const found = findEslintConfig(cwd);
            if (found?.json) return withoutSchema(readJsonc(found.file));
        }
    } catch {
        return undefined;
    }
    return undefined;
}

export async function normalizeToolingConfig(
    config: ToolchainConfig,
    options: NormalizeToolingOptions
): Promise<NormalizedTooling> {
    const warnings: WarningId[] = [];
    let fmt = sectionConfig(config.fmt) as ToolchainFmtConfig | undefined;
    let lint = sectionConfig(config.lint) as ToolchainLintConfig | undefined;
    const settings = readSettings(options.vscodeSettingsPath);
    const names = hasUserConfig(options.cwd, 'fmt');
    const lintNames = hasUserConfig(options.cwd, 'lint');

    if (sectionEnabled(config.fmt) && resolveFmtTools(config).length === 0) {
        const disabled = disabledTools(config.fmt, FORMATTER_PRECEDENCE);
        const tool =
            installedTool(options.cwd, FORMATTER_PRECEDENCE, disabled) ??
            editorTool(settings, FORMATTER_PRECEDENCE, 'fmt');
        const fallback = !tool && !names;
        if (fallback) warnings.push('fmt.no-tool');
        const selected = tool ?? 'oxc';
        const next: ToolchainFmtConfig = { ...fmt };
        if (selected === 'oxc') {
            const migrated = await migratedFmtOptions(options.cwd);
            const merged = deepMerge<Json>(DEFAULT_FMT_RULES as Json, migrated ?? {});
            mergeIgnorePatterns(merged, migrated ?? {});
            next.oxc = merged;
        } else {
            (next as Record<string, unknown>)[selected] =
                existingConfigOptions(options.cwd, selected) ?? {};
        }
        fmt = next;
    }

    if (sectionEnabled(config.lint) && resolveLintTools(config).length === 0) {
        const disabled = disabledTools(config.lint, LINTER_PRECEDENCE);
        const tool =
            installedTool(options.cwd, LINTER_PRECEDENCE, disabled) ??
            editorTool(settings, LINTER_PRECEDENCE, 'lint');
        const fallback = !tool && !lintNames;
        if (fallback) warnings.push('lint.no-tool');
        const selected = tool ?? 'oxc';
        const next: ToolchainLintConfig = { ...lint };
        if (selected === 'oxc') {
            const migrated = await migratedLintOptions(options.cwd);
            const merged = deepMerge<Json>(DEFAULT_LINT_RULES as Json, migrated ?? {});
            mergeIgnorePatterns(merged, migrated ?? {});
            next.oxc = merged;
        } else {
            (next as Record<string, unknown>)[selected] =
                existingConfigOptions(options.cwd, selected) ?? {};
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
