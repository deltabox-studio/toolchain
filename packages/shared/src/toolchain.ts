/**
 * The shared tooling-configuration model and the sync/watch task contract.
 *
 * A consumer drops a `dbx.config.{ts,js,mjs,cjs,json}` file at the repo root
 * exporting `{ toolchain: { ...sections } }`; each `@deltabox/toolchain` package
 * exposes a {@link SyncTask} that turns that config into generated/managed files
 * (workflows, `biome.json`, tsconfigs, VS Code settings, ...). The core package
 * loads the config and runs the tasks (optionally watching for changes).
 *
 * The config *sections* are defined as Zod schemas in `config-schema.ts` (the
 * single source of truth); their TypeScript types are generated into
 * `config-types.ts`. Only `hooks` (functions) is hand-written.
 */

import { isVendorWorkflowConfig } from './config-schema/workflow.js';
import type { ChangelogConfig, CiChangelogConfig, ToolchainCiConfig } from './config-types.js';
import { deepMerge, isPlainObject } from './object-utils.js';
import type { Replacements } from './template.js';
import type {
    DbxConfig,
    DbxConfigFunction,
    DbxConfigInput,
    FormatterTool,
    LinterTool,
    ResolvedToolchainEnabled,
    ToolchainConfig,
    ToolchainEnabledSetting,
    ToolchainSection,
} from './types/index.js';

export * from './config-schema/index.js';
export * from './config-types.js';

/**
 * Identity helper that gives a config file full type-checking + autocomplete.
 * Mirrors Vite's `defineConfig`: the argument may be an object, a promise, or a
 * sync/async callback returning the config. The loader resolves it, so a config
 * can do async work before returning `{ toolchain }`.
 */
export function defineConfig(config: Promise<DbxConfig>): Promise<DbxConfig>;
export function defineConfig(config: DbxConfigFunction): DbxConfigFunction;
export function defineConfig(config: DbxConfig): DbxConfig;
export function defineConfig(config: DbxConfigInput): DbxConfigInput {
    return config;
}

/**
 * Whether an optional top-level config section is enabled.
 *
 * Sections are **opt-in by presence**: a section only runs when it is defined
 * in `dbx.config.*` (and not explicitly disabled). A consumer can
 * enable a tooling area with the boolean shorthand (`biome: true`) when it needs
 * no options, or configure it with an object (`biome: { overrides: { ... } }`).
 * Either way the tooling never touches an area the consumer did not ask for.
 */
export function sectionEnabled(section: boolean | object | undefined): boolean {
    if (section === undefined) return false;
    if (typeof section === 'boolean') return section;
    return (section as { enabled?: boolean }).enabled !== false;
}

/**
 * The options object for a section (`undefined` when it is a boolean/absent).
 * Not every section declares `enabled` (eg. `providers`), so the constraint is
 * any object rather than `{ enabled?: boolean }`.
 */
export function sectionConfig<T extends object>(
    section: ToolchainSection<T> | undefined
): T | undefined {
    return section !== undefined && typeof section === 'object' ? section : undefined;
}

/**
 * Whether a section's managed files should be regenerated during sync.
 *
 * A section only regenerates when it is enabled (opt-in by presence) and does
 * not opt out with `regenerate: false`. The default is `true`, so existing
 * configs keep their current behaviour.
 */
export function regenerateEnabled(
    section: boolean | { enabled?: boolean; regenerate?: boolean } | undefined
): boolean {
    if (!sectionEnabled(section)) return false;
    return sectionConfig(section)?.regenerate !== false;
}

/** Normalize `toolchain.enabled` (`true | false | { disabled, scope }`). */
export function resolveToolchainEnabled(
    config: { enabled?: boolean | ToolchainEnabledSetting } | undefined
): ResolvedToolchainEnabled {
    const value = config?.enabled;
    if (value === undefined) return { enabled: true, scope: 'workspace' };
    if (typeof value === 'boolean') return { enabled: value, scope: 'workspace' };
    return { enabled: value.disabled !== true, scope: value.scope };
}

/**
 * Reject a non-workspace scope in a config file or the Vite plugin's inline
 * `dbx({ toolchain })` config. Global scope is only settable through the CLI /
 * programmatic API and the VS Code extension.
 */
export function assertWorkspaceEnabledScope(
    config: { enabled?: boolean | ToolchainEnabledSetting } | undefined,
    source = 'config'
): void {
    const value = config?.enabled;
    if (value === undefined || typeof value === 'boolean') return;
    if (value.scope !== 'workspace') {
        throw new Error(
            `${source}: \`toolchain.enabled\` only accepts the \`workspace\` scope in config ` +
                `files and the Vite plugin (got \`${value.scope}\`). Use \`dbx enable/disable ` +
                '--global\` or the VS Code command to change the global scope.'
        );
    }
}

/** The file names a config loader looks for, in priority order. */
export const CONFIG_FILE_NAMES = [
    'dbx.config.ts',
    'dbx.config.mts',
    'dbx.config.js',
    'dbx.config.mjs',
    'dbx.config.cjs',
    'dbx.config.json',
] as const;

/** Derive the `owner/name` slug from a repository URL. */
export function repoSlugFromUrl(repo: string | undefined): string | undefined {
    if (!repo) return undefined;
    const match = repo.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/);
    return match?.[1] && match[2] ? `${match[1]}/${match[2]}` : undefined;
}

/** Normalize a `branches.main` / `branches.dev` value (`string | string[]`) to an array. */
function branchList(value: string | string[] | undefined): string[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

/**
 * The `ci` section's options, when the section is enabled. It is opt-in by
 * presence, and `enabled: false` disables every nested workflow.
 */
export function resolveCiConfig(config: ToolchainConfig = {}): ToolchainCiConfig | undefined {
    return sectionEnabled(config.ci) ? sectionConfig(config.ci) : undefined;
}

/**
 * The changelog pipeline options, merging the manual `toolchain.changelog`
 * section under `ci.changelog`. `ci.changelog` wins when it sets the same
 * option; when it is enabled but not configured (`true`, a raw workflow string,
 * or workflow-only options) the manual section's options still apply.
 */
export function resolveChangelogConfig(
    config: ToolchainConfig = {}
): CiChangelogConfig | undefined {
    const legacy = sectionConfig(config.changelog);
    const legacyOptions = legacy && sectionEnabled(legacy) ? legacy : undefined;
    const setting = resolveCiConfig(config)?.changelog;
    if (setting === false) return undefined;
    if (setting === undefined || setting === true) return legacyOptions;
    if (typeof setting === 'string') return legacyOptions;
    // A complete vendor workflow is a workflow setting, not changelog pipeline config.
    if (isVendorWorkflowConfig(setting)) return legacyOptions;
    const changelog = setting as CiChangelogConfig;
    if (!sectionEnabled(changelog)) return undefined;
    return legacyOptions ? (deepMerge(legacyOptions, changelog) as CiChangelogConfig) : changelog;
}

/** Default package-manager versions used when a config omits `packageManagerVersion`. */
export const DEFAULT_PACKAGE_MANAGER_VERSIONS = {
    yarn: '4.17.1',
    pnpm: '10.11.1',
    npm: '11.19.0',
    bun: '1.3.0',
} as const;

/** The default version for a package manager, when known. */
export function defaultPackageManagerVersion(packageManager: string): string | undefined {
    return DEFAULT_PACKAGE_MANAGER_VERSIONS[
        packageManager as keyof typeof DEFAULT_PACKAGE_MANAGER_VERSIONS
    ];
}

/** Formatter tools, highest priority first. */
export const FORMATTER_PRECEDENCE = ['oxc', 'biome', 'prettier', 'dprint'] as const;
/** Linter tools, highest priority first. */
export const LINTER_PRECEDENCE = ['oxc', 'biome', 'eslint'] as const;

function sectionOptions(value: unknown): Record<string, unknown> | undefined {
    return sectionEnabled(value as boolean | object | undefined)
        ? (sectionConfig(value as never) as Record<string, unknown> | undefined)
        : undefined;
}

/** The configured formatters, in precedence order (oxc includes `vite.fmt`). */
export function resolveFmtTools(config: ToolchainConfig = {}): FormatterTool[] {
    const fmt = sectionOptions(config.fmt) ?? {};
    const vite = sectionOptions(config.vite);
    const active = new Set<FormatterTool>();
    if (vite?.fmt !== undefined && vite.fmt !== false) active.add('oxc');
    if (fmt.oxc !== undefined && fmt.oxc !== false) active.add('oxc');
    if (fmt.biome !== undefined && fmt.biome !== false) active.add('biome');
    if (fmt.prettier !== undefined && fmt.prettier !== false) active.add('prettier');
    if (fmt.dprint !== undefined && fmt.dprint !== false) active.add('dprint');
    return FORMATTER_PRECEDENCE.filter(tool => active.has(tool));
}

/** The configured linters, in precedence order (oxc includes `vite.lint`). */
export function resolveLintTools(config: ToolchainConfig = {}): LinterTool[] {
    const lint = sectionOptions(config.lint) ?? {};
    const vite = sectionOptions(config.vite);
    const active = new Set<LinterTool>();
    if (vite?.lint !== undefined && vite.lint !== false) active.add('oxc');
    if (lint.oxc !== undefined && lint.oxc !== false) active.add('oxc');
    if (lint.biome !== undefined && lint.biome !== false) active.add('biome');
    if (lint.eslint !== undefined && lint.eslint !== false) active.add('eslint');
    return LINTER_PRECEDENCE.filter(tool => active.has(tool));
}

/** The winning formatter for editor defaults. */
export function resolveFmtTool(config: ToolchainConfig = {}): FormatterTool | undefined {
    return resolveFmtTools(config)[0];
}

/** The winning linter for editor defaults. */
export function resolveLintTool(config: ToolchainConfig = {}): LinterTool | undefined {
    return resolveLintTools(config)[0];
}

/** Merge `vite.fmt` over `fmt.oxc` (leaves/arrays in `vite.fmt` win). */
export function resolveOxcFmtConfig(config: ToolchainConfig = {}): unknown {
    const fmt = sectionOptions(config.fmt)?.oxc;
    const vite = sectionOptions(config.vite)?.fmt;
    if (vite === undefined) return fmt;
    if (vite === false) return false;
    if (vite === true) return fmt ?? true;
    if (fmt === undefined) return vite;
    return isPlainObject(fmt) && isPlainObject(vite) ? deepMerge(fmt, vite) : vite;
}

/** Merge `vite.lint` over `lint.oxc` (leaves/arrays in `vite.lint` win). */
export function resolveOxcLintConfig(config: ToolchainConfig = {}): unknown {
    const lint = sectionOptions(config.lint)?.oxc;
    const vite = sectionOptions(config.vite)?.lint;
    if (vite === undefined) return lint;
    if (vite === false) return false;
    if (vite === true) return lint ?? true;
    if (lint === undefined) return vite;
    return isPlainObject(lint) && isPlainObject(vite) ? deepMerge(lint, vite) : vite;
}

/** Whether the changelog workflow/pipeline is enabled (`ci.changelog`). */
export function changelogSectionEnabled(config: ToolchainConfig = {}): boolean {
    const setting = resolveCiConfig(config)?.changelog;
    if (setting === undefined) return false;
    if (typeof setting === 'boolean') return setting;
    // A raw YAML string is enabled when it has content (an empty string disables it).
    if (typeof setting === 'string') return setting.trim().length > 0;
    return sectionEnabled(setting);
}

/**
 * Whether commitlint is enabled for the changelog pipeline. It defaults to
 * `true`; set `ci.changelog.commitlint: false` (or `{ enabled: false }`) to
 * generate changelogs without the Conventional-Commits rules.
 */
export function resolveCommitlintEnabled(changelog?: ChangelogConfig): boolean {
    const commitlint = changelog?.commitlint;
    if (commitlint === undefined) return true;
    if (typeof commitlint === 'boolean') return commitlint;
    return commitlint.enabled !== false;
}

/**
 * The resolved changelog branches. `main` defaults to `['main']`; `dev` has **no
 * default** and reuses `main` when omitted, so a single-branch repo needs no
 * `dev`. Each side accepts a glob or an array of globs.
 */
export function resolveChangelogBranches(changelog?: CiChangelogConfig): {
    main: string[];
    dev: string[];
} {
    const branches = changelog?.branches ?? {};
    const main = branchList(branches.main);
    if (main.length === 0) main.push('main');
    const dev = branchList(branches.dev);
    return { main, dev: dev.length > 0 ? dev : main };
}

/**
 * Flatten a {@link ToolchainConfig} into the `{{ token }}` replacements every
 * template understands. Defaults are chosen so a bare config still renders.
 */
export function resolveTokens(config: ToolchainConfig = {}): Replacements {
    const project = config.project ?? {};
    const changelog = resolveChangelogConfig(config) ?? {};
    const branches = resolveChangelogBranches(changelog);
    const name = project.name ?? 'app';
    const packageManager = project.packageManager ?? 'yarn';
    const packageManagerVersion =
        project.packageManagerVersion ?? defaultPackageManagerVersion(packageManager) ?? '4.17.1';
    return {
        name,
        scope: project.scope ?? '',
        author: project.author ?? '',
        license: project.license ?? 'MIT',
        homepage: project.homepage ?? '',
        repo: project.repo ?? '',
        repoSlug: repoSlugFromUrl(project.repo) ?? '',
        description: project.description ?? '',
        nodeVersion: project.nodeVersion ?? '22',
        packageManager,
        yarnVersion: packageManagerVersion,
        packageManagerVersion,
        mainBranch: branches.main[0] ?? 'main',
        devBranch: branches.dev[0] ?? 'main',
    };
}
