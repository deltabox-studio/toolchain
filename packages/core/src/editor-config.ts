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
    isPlainObject,
    resolveFmtTool,
    resolveFmtTools,
    resolveLintTool,
    resolveLintTools,
    type SyncTask,
    sectionConfig,
    type ToolchainConfig,
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
        'editor.formatOnSave': true,
        ...(tool === 'oxc'
            ? {
                  'oxc.disableNestedConfig': true,
                  'oxc.fmt.disableNestedConfig': true,
                  'editor.formatOnSaveMode': 'file',
              }
            : {}),
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

function warningMessage(
    kind: 'formatter' | 'linter',
    tools: readonly string[],
    winner: string
): string {
    return `Multiple ${kind}s configured (${tools.join(', ')}); using ${winner} (precedence) for editor settings.`;
}

/**
 * Warn when more than one formatter/linter is configured. Runs even when editor
 * defaults are off so CLI/extension users still see the precedence notice.
 */
export function toolingConfigTask(): SyncTask {
    return {
        name: 'tooling',
        enabled: config =>
            resolveFmtTools(config).length > 0 || resolveLintTools(config).length > 0,
        run: ctx => {
            const fmt = resolveFmtTools(ctx.config);
            const lint = resolveLintTools(ctx.config);
            if (fmt.length > 1) {
                ctx.warn(warningMessage('formatter', fmt, fmt[0] as string), 'fmt.multiple');
            }
            if (lint.length > 1) {
                ctx.warn(warningMessage('linter', lint, lint[0] as string), 'lint.multiple');
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
            sectionConfig(config.fmt)?.vscode === true ||
            sectionConfig(config.lint)?.vscode === true,
        run: ctx => {
            const fmt = resolveFmtTool(ctx.config);
            const lint = resolveLintTool(ctx.config);
            const patch: Record<string, unknown> = {};
            if (sectionConfig(ctx.config.fmt)?.vscode === true && fmt) {
                Object.assign(patch, formatterSettings(fmt));
            }
            if (sectionConfig(ctx.config.lint)?.vscode === true && lint) {
                patch['editor.codeActionsOnSave'] = LINTER_ACTIONS[lint] ?? {};
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
