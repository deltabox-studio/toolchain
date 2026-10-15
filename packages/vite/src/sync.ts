/**
 * The `vite` sync task: manages a `vite.config.ts` (Vite + Vitest + Oxlint +
 * Oxfmt + Vite Task in one file) when the consumer enables the `vite` section.
 *
 * The config is opt-in by section presence and never written for a consumer who
 * runs `vp migrate` themselves (`vite: { config: false }`).
 */

import {
    applyReplacementsDeep,
    deepMerge,
    isPlainObject,
    type Replacements,
    type SyncTask,
    sectionConfig,
    sectionEnabled,
    type ToolingViteConfig,
} from '@deltabox/toolchain-shared';

/** The default Vitest include globs. */
export const DEFAULT_TEST_INCLUDE = ['src/**/*.test.ts', 'tests/**/*.test.ts'];
/** The default Oxlint ignore globs. */
export const DEFAULT_LINT_IGNORE = ['dist/**'];

/**
 * Render an object literal as TypeScript source (unquoting identifier keys) so
 * the generated `vite.config.ts` reads like a hand-written config.
 */
function renderObjectLiteral(value: unknown, indent = 0): string {
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const inner = value.map(item => renderObjectLiteral(item, indent + 1)).join(', ');
        return `[${inner}]`;
    }
    if (isPlainObject(value)) {
        const entries = Object.entries(value);
        if (entries.length === 0) return '{}';
        const pad = '    '.repeat(indent + 1);
        const close = '    '.repeat(indent);
        const body = entries
            .map(([key, child]) => {
                const name = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
                return `${pad}${name}: ${renderObjectLiteral(child, indent + 1)}`;
            })
            .join(',\n');
        return `{\n${body}\n${close}}`;
    }
    return JSON.stringify(value);
}

/**
 * Build the `vite.config.ts` object for a consumer: Vite plugins + the Vitest /
 * Oxlint / Oxfmt sections, plus `create.defaultTemplate` when set, with the
 * consumer's `overrides` deep-merged on top and `{{ token }}`s resolved.
 */
export function viteConfigObject(
    tokens: Replacements = {},
    config: ToolingViteConfig = {}
): Record<string, unknown> {
    const base: Record<string, unknown> = {
        plugins: [],
        test: { include: config.testInclude ?? DEFAULT_TEST_INCLUDE },
        lint: { ignorePatterns: config.lintIgnore ?? DEFAULT_LINT_IGNORE },
        fmt: { semi: true, singleQuote: true },
        ...(config.defaultTemplate ? { create: { defaultTemplate: config.defaultTemplate } } : {}),
    };
    const merged = config.overrides ? deepMerge(base, config.overrides) : base;
    return applyReplacementsDeep(merged, tokens);
}

/** Serialize the Vite+ config to a `vite.config.ts` module. */
export function renderViteConfig(
    tokens: Replacements = {},
    config: ToolingViteConfig = {}
): string {
    return `import { defineConfig } from 'vite-plus';\n\nexport default defineConfig(${renderObjectLiteral(
        viteConfigObject(tokens, config)
    )});\n`;
}

/**
 * The vite sync task: writes `vite.config.ts` when the `vite` section is enabled
 * (and `config` is not `false`). Runs for every project kind.
 */
export function viteSyncTask(): SyncTask {
    return {
        name: 'vite',
        projectTypes: ['monorepo-root', 'monorepo-workspace', 'project'],
        enabled: config => sectionEnabled(config.vite),
        run: ctx => {
            const section = sectionConfig(ctx.config.vite) ?? {};
            if (section.config === false) return [];
            return [{ path: 'vite.config.ts', content: renderViteConfig(ctx.tokens, section) }];
        },
    };
}
