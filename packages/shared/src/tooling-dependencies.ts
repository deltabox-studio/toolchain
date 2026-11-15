/**
 * The npm packages that provide each formatter/linter, plus the versions a
 * scaffold or migration installs when the consumer does not pin them.
 *
 * A tool is "declared" when any of its packages is listed in the project's
 * `package.json` (root or the nearest workspace). The defaults are the latest
 * stable releases at the time of this release; callers can override them with
 * `versions` so a consumer never has to accept a stale pin.
 */

import type { PackageJson } from './types/index.js';
import type { FormatterTool, LinterTool } from './types/tools.js';

/** Any tool the toolchain can provision for formatting or linting. */
export type ToolingTool = FormatterTool | LinterTool;

/** The formatter and linter a consumer ends up using. */
export interface ToolingSelection {
    fmt?: FormatterTool;
    lint?: LinterTool;
}

/** The unique tools in a selection. */
export function selectionTools(selection: ToolingSelection): ToolingTool[] {
    return [...new Set([selection.fmt, selection.lint].filter(Boolean) as ToolingTool[])];
}

/**
 * Parse repeated `package@range` overrides (`--tool-version`), keeping the
 * package's scope (`@biomejs/biome@^2` -> `@biomejs/biome`).
 */
export function parseToolVersions(values: readonly string[] | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    for (const value of values ?? []) {
        const at = value.lastIndexOf('@');
        if (at <= 0) continue;
        const name = value.slice(0, at);
        const version = value.slice(at + 1);
        if (name && version) out[name] = version;
    }
    return out;
}

const DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
] as const;

/**
 * Packages that satisfy a formatter. The first entry is the one a scaffold or
 * migration installs; the rest are accepted aliases (including `vite-plus`,
 * which ships Oxfmt).
 */
export const FORMATTER_DEPENDENCIES: Record<FormatterTool, readonly string[]> = {
    oxc: ['oxfmt', '@oxc-project/oxfmt', 'vite-plus'],
    biome: ['@biomejs/biome'],
    prettier: ['prettier'],
    dprint: ['dprint'],
};

/** Packages that satisfy a linter (first entry is installed). */
export const LINTER_DEPENDENCIES: Record<LinterTool, readonly string[]> = {
    oxc: ['oxlint', '@oxc-project/oxlint', 'vite-plus'],
    biome: ['@biomejs/biome'],
    eslint: ['eslint'],
};

/** Packages a scaffold/migration installs for a tool (the preferred entry). */
export const TOOLING_DEPENDENCY_PACKAGES: Record<ToolingTool, readonly string[]> = {
    oxc: ['oxfmt', 'oxlint'],
    biome: ['@biomejs/biome'],
    prettier: ['prettier'],
    dprint: ['dprint'],
    eslint: ['eslint'],
};

/** Latest stable versions (specific semver ranges) at the time of this release. */
export const DEFAULT_TOOLING_VERSIONS: Record<string, string> = {
    '@biomejs/biome': '^2.6.6',
    dprint: '^0.64.3',
    eslint: '^10.14.0',
    oxfmt: '^0.78.0',
    oxlint: '^1.93.0',
    prettier: '^3.9.10',
};

/** Every dependency name declared by a `package.json`. */
export function declaredDependencies(pkg: PackageJson | undefined): Set<string> {
    const names = new Set<string>();
    if (!pkg) return names;
    for (const field of DEPENDENCY_FIELDS) {
        for (const name of Object.keys(pkg[field] ?? {})) names.add(name);
    }
    return names;
}

/** Whether a `package.json` declares a package that provides `tool`. */
export function declaresTool(
    pkg: PackageJson | undefined,
    kind: 'fmt' | 'lint',
    tool: ToolingTool
): boolean {
    const declared = declaredDependencies(pkg);
    const candidates =
        kind === 'fmt'
            ? FORMATTER_DEPENDENCIES[tool as FormatterTool]
            : LINTER_DEPENDENCIES[tool as LinterTool];
    return candidates?.some(name => declared.has(name)) === true;
}

/**
 * The dependencies to add for a set of tools, merged into one map. Duplicate
 * packages (eg. Biome for both fmt and lint) are added once.
 */
export function toolingDependencies(
    tools: Iterable<ToolingTool>,
    versions: Record<string, string> = {}
): Record<string, string> {
    const resolved = { ...DEFAULT_TOOLING_VERSIONS, ...versions };
    const out: Record<string, string> = {};
    for (const tool of new Set(tools)) {
        for (const name of TOOLING_DEPENDENCY_PACKAGES[tool] ?? []) {
            const version = resolved[name];
            if (version) out[name] = version;
        }
    }
    return out;
}
