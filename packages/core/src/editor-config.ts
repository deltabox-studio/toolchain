/**
 * Unmanaged editor defaults for the configured formatter/linter.
 *
 * Unlike {@link vscodeSyncTask}, this task never adds `.vscode/settings.json` to
 * the manifest and never overrides existing keys: it only fills in missing
 * defaults, so consumers can freely edit/remove them. The winning tool follows
 * `FORMATTER_PRECEDENCE` / `LINTER_PRECEDENCE`.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
    deepMerge,
    errorMessage,
    FORMATTER_PRECEDENCE,
    isPlainObject,
    LINTER_PRECEDENCE,
    resolveFmtTool,
    resolveFmtTools,
    resolveLintTool,
    resolveLintTools,
    sectionConfig,
    sectionEnabled,
    type SyncTask,
    type ToolchainConfig,
    type ToolchainVscodeSettings,
    warningMessage,
} from '@deltabox/toolchain-shared';

const FORMATTER_EXTENSIONS: Record<string, string> = {
    oxc: 'oxc.oxc-vscode',
    biome: 'biomejs.biome',
    prettier: 'esbenp.prettier-vscode',
    dprint: 'dprint.dprint',
};

const LINTER_ACTIONS: Record<string, Record<string, string>> = {
    oxc: { 'source.fixAll.oxc': 'explicit' },
    biome: { 'quickfix.biome': 'explicit', 'source.organizeImports.biome': 'explicit' },
    eslint: { 'source.fixAll.eslint': 'explicit' },
};

const FORMATTER_LANGUAGES = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];

function formatterSettings(tool: string): Record<string, unknown> {
    const extension = FORMATTER_EXTENSIONS[tool];
    if (!extension) return {};
    return {
        'editor.defaultFormatter': extension,
        ...Object.fromEntries(
            FORMATTER_LANGUAGES.map(language => [
                `[${language}]`,
                { 'editor.defaultFormatter': extension },
            ])
        ),
    };
}

/** Add only keys the target does not already have (recursing into objects). */
function addMissing(target: Record<string, unknown>, patch: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(patch)) {
        const current = target[key];
        if (current === undefined) target[key] = value;
        else if (isPlainObject(current) && isPlainObject(value)) addMissing(current, value);
    }
}

/** Whether `fmt.vscode` / `lint.vscode` is enabled (`true` or an options object). */
function vscodeEnabled(value: unknown): boolean {
    return value === true || isPlainObject(value);
}

/**
 * Apply the `vscode` section's overrides/exclusions to the generated defaults.
 * `exclude` lists exact setting keys (eg. `editor.defaultFormatter` or
 * `[typescript]`) to omit.
 */
function applyVscodeOptions(
    patch: Record<string, unknown>,
    value: unknown
): Record<string, unknown> {
    if (!isPlainObject(value)) return patch;
    const options = value as ToolchainVscodeSettings;
    let out = options.overrides ? deepMerge(patch, options.overrides) : patch;
    for (const key of options.exclude ?? []) {
        const { [key]: _excluded, ...rest } = out;
        out = rest;
    }
    return out;
}

/**
 * Emit centralized config warnings: tool precedence conflicts and deprecated
 * sections. Runs even when editor defaults are off so CLI/extension users still
 * see the notices.
 */
export function toolingConfigTask(): SyncTask {
    return {
        name: 'tooling',
        enabled: config =>
            sectionEnabled(config.fmt) ||
            sectionEnabled(config.lint) ||
            sectionEnabled(config.biome),
        run: ctx => {
            const legacyBiome = sectionEnabled(ctx.config.biome);
            const activeFmt = resolveFmtTools(ctx.config);
            const activeLint = resolveLintTools(ctx.config);
            const fmt = legacyBiome
                ? FORMATTER_PRECEDENCE.filter(tool => tool === 'biome' || activeFmt.includes(tool))
                : activeFmt;
            const lint = legacyBiome
                ? LINTER_PRECEDENCE.filter(tool => tool === 'biome' || activeLint.includes(tool))
                : activeLint;
            if (fmt.length > 1) {
                ctx.warn(
                    warningMessage('fmt.conflict', {
                        tools: fmt.join(', '),
                        winner: fmt[0] as string,
                    }),
                    'fmt.conflict'
                );
            }
            if (lint.length > 1) {
                ctx.warn(
                    warningMessage('lint.conflict', {
                        tools: lint.join(', '),
                        winner: lint[0] as string,
                    }),
                    'lint.conflict'
                );
            }
            if (legacyBiome) {
                ctx.warn(errorMessage('deprecated.section.biome'), 'deprecated.section.biome');
            }
            return [];
        },
    };
}

/** Add project-scoped VS Code defaults when `fmt.vscode` / `lint.vscode` is on. */
export function editorConfigSyncTask(): SyncTask {
    return {
        name: 'editor-config',
        projectTypes: ['monorepo-root', 'project'],
        enabled: (config: ToolchainConfig) =>
            vscodeEnabled(
                sectionEnabled(config.fmt) ? sectionConfig(config.fmt)?.vscode : undefined
            ) ||
            vscodeEnabled(
                sectionEnabled(config.lint) ? sectionConfig(config.lint)?.vscode : undefined
            ),
        run: ctx => {
            const fmt = resolveFmtTool(ctx.config);
            const lint = resolveLintTool(ctx.config);
            const fmtVscode = sectionEnabled(ctx.config.fmt)
                ? sectionConfig(ctx.config.fmt)?.vscode
                : undefined;
            const lintVscode = sectionEnabled(ctx.config.lint)
                ? sectionConfig(ctx.config.lint)?.vscode
                : undefined;
            const patch: Record<string, unknown> = {};
            if (vscodeEnabled(fmtVscode) && fmt) {
                Object.assign(patch, applyVscodeOptions(formatterSettings(fmt), fmtVscode));
            }
            if (vscodeEnabled(lintVscode) && lint) {
                Object.assign(
                    patch,
                    applyVscodeOptions(
                        { 'editor.codeActionsOnSave': LINTER_ACTIONS[lint] ?? {} },
                        lintVscode
                    )
                );
            }
            if (Object.keys(patch).length === 0) return [];

            const file = path.join(ctx.cwd, '.vscode', 'settings.json');
            let settings: Record<string, unknown> = {};
            if (fs.existsSync(file)) {
                try {
                    const parsed = JSON.parse(
                        fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '')
                    ) as unknown;
                    if (!isPlainObject(parsed)) {
                        ctx.warn(
                            `cannot add editor defaults: ${file} is not a JSON object.`,
                            'vscode.settings-invalid'
                        );
                        return [];
                    }
                    settings = parsed;
                } catch {
                    ctx.warn(
                        `cannot add editor defaults: ${file} is not valid JSON.`,
                        'vscode.settings-invalid'
                    );
                    return [];
                }
            }

            // `--check` is read-only: report nothing (the file is intentionally
            // unmanaged) and never write the generated defaults.
            if (ctx.check) return [];

            const before = JSON.stringify(settings);
            addMissing(settings, patch);
            if (JSON.stringify(settings) !== before) {
                fs.mkdirSync(path.dirname(file), { recursive: true });
                fs.writeFileSync(file, `${JSON.stringify(settings, null, 4)}\n`, 'utf-8');
            }
            return [];
        },
    };
}
