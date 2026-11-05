import type { OxfmtConfig } from './config-schema/generated/oxfmt-config.js';
import type { OxlintConfig } from './config-schema/generated/oxlint-config.js';
import { DEFAULT_FMT_IGNORE_PATTERNS, DEFAULT_LINT_IGNORE_PATTERNS } from './ignore.js';
import { isPlainObject } from './object-utils.js';

/** The Oxfmt options accepted by Vite+ (`toolchain.vite.fmt`). */
export type ToolchainOxfmtConfig = OxfmtConfig;

/** The Oxlint options accepted by Vite+ (`toolchain.vite.lint`). */
export type ToolchainOxlintConfig = OxlintConfig;

/** The object form of Oxfmt's `sortImports` option. */
export type FmtSortImports = Exclude<NonNullable<OxfmtConfig['sortImports']>, boolean>;

/** One custom `sortImports` group. */
export type FmtCustomGroup = NonNullable<FmtSortImports['customGroups']>[number];

/** One entry in `sortImports.groups`. */
export type FmtSortGroup = NonNullable<FmtSortImports['groups']>[number];

/** The group name used for a project's own workspace packages. */
export const DEFAULT_FMT_SORT_GROUP = 'workspace';

/**
 * The default import groups: builtins, external packages, source-internal
 * aliases, relatives, styles and unknowns. The `workspace` group is inserted
 * after `external` by {@link applyFmtCustomGroups}.
 */
export const DEFAULT_FMT_SORT_GROUPS = [
    'builtin',
    'external',
    ['internal', 'subpath'],
    ['parent', 'sibling', 'index'],
    'style',
    'unknown',
] as const;

/** A mutable copy of the default groups (the exported constant is readonly). */
function defaultFmtSortGroups(): FmtSortGroup[] {
    return DEFAULT_FMT_SORT_GROUPS.map(group =>
        Array.isArray(group) ? [...group] : group
    ) as FmtSortGroup[];
}

/** The default Oxfmt `sortImports` options (without resolved custom groups). */
export const DEFAULT_FMT_SORT_IMPORTS: FmtSortImports = {
    groups: defaultFmtSortGroups(),
    customGroups: [],
    internalPattern: ['~/', '@/'],
    newlinesBetween: true,
};

/**
 * The Oxfmt options used when `vite.fmt` is `true`, and the base an options
 * object is merged over. Import sorting is enabled by default; the workspace
 * custom group is filled in from the project graph by `resolveFmtCustomGroups`.
 */
export const DEFAULT_FMT_RULES: ToolchainOxfmtConfig = {
    useTabs: false,
    tabWidth: 4,
    printWidth: 100,
    endOfLine: 'lf',
    insertFinalNewline: true,
    singleQuote: true,
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    trailingComma: 'es5',
    semi: true,
    arrowParens: 'avoid',
    bracketSpacing: true,
    bracketSameLine: false,
    singleAttributePerLine: false,
    objectWrap: 'preserve',
    proseWrap: 'preserve',
    embeddedLanguageFormatting: 'auto',
    htmlWhitespaceSensitivity: 'css',
    vueIndentScriptAndStyle: false,
    sortPackageJson: false,
    sortImports: {
        ...DEFAULT_FMT_SORT_IMPORTS,
        groups: defaultFmtSortGroups(),
        customGroups: [],
    },
    ignorePatterns: [...DEFAULT_FMT_IGNORE_PATTERNS],
};

/** The `name`/`scope` fields needed to build a workspace custom group. */
export interface FmtProjectIdentity {
    name?: string;
    scope?: string;
}

/**
 * Build the custom `sortImports` group for a set of projects. Scopes become
 * `@scope/**` patterns; unscoped and scoped project names also match the bare
 * name and its subpaths, so workspace imports sort together.
 */
export function fmtCustomGroupsForProjects(
    projects: Iterable<FmtProjectIdentity | undefined | null>
): FmtCustomGroup[] {
    const scopes = new Set<string>();
    const names = new Set<string>();
    for (const project of projects) {
        if (!project) continue;
        if (project.scope) scopes.add(project.scope);
        if (project.name) names.add(project.name);
    }
    const patterns = [
        ...[...scopes].sort().map(scope => `${scope}/**`),
        ...[...names].sort().flatMap(name => [name, `${name}/**`]),
    ];
    const unique = [...new Set(patterns)];
    return unique.length > 0
        ? [{ groupName: DEFAULT_FMT_SORT_GROUP, elementNamePattern: unique }]
        : [];
}

/** The names referenced by a `sortImports.groups` entry. */
function groupNames(group: FmtSortGroup): string[] {
    if (typeof group === 'string') return [group];
    return Array.isArray(group) ? group : [];
}

/** Ensure a custom group is listed in `sortImports.groups` (after external). */
function ensureGroup(groups: FmtSortGroup[], name: string): void {
    if (groups.some(group => groupNames(group).includes(name))) return;
    const external = groups.findIndex(group => groupNames(group).includes('external'));
    groups.splice(external === -1 ? groups.length : external + 1, 0, name);
}

/**
 * Add the resolved workspace custom groups to an Oxfmt config, preserving any
 * groups the consumer already defined. `sortImports: false` is respected; when
 * `sortImports` is absent the config is left alone.
 */
export function applyFmtCustomGroups(
    fmt: ToolchainOxfmtConfig,
    customGroups: FmtCustomGroup[]
): ToolchainOxfmtConfig {
    if (customGroups.length === 0 || fmt.sortImports === undefined || fmt.sortImports === false) {
        return fmt;
    }
    const base: FmtSortImports =
        fmt.sortImports === true || !isPlainObject(fmt.sortImports)
            ? {
                  ...DEFAULT_FMT_SORT_IMPORTS,
                  groups: defaultFmtSortGroups(),
                  customGroups: [],
              }
            : { ...fmt.sortImports };
    const groups: FmtSortGroup[] = Array.isArray(base.groups)
        ? [...base.groups]
        : defaultFmtSortGroups();
    const existing: FmtCustomGroup[] = Array.isArray(base.customGroups)
        ? base.customGroups.map(group => ({ ...group }))
        : [];
    for (const group of customGroups) {
        const index = existing.findIndex(item => item.groupName === group.groupName);
        if (index === -1) {
            existing.push({ ...group });
        } else {
            const current = existing[index];
            existing[index] = {
                ...current,
                elementNamePattern: [
                    ...new Set([
                        ...(current?.elementNamePattern ?? []),
                        ...(group.elementNamePattern ?? []),
                    ]),
                ],
            };
        }
        if (group.groupName) ensureGroup(groups, group.groupName);
    }
    return { ...fmt, sortImports: { ...base, groups, customGroups: existing } };
}

/**
 * The Oxlint options used when `vite.lint` is `true`, and the base an options
 * object is merged over. Framework/a11y rules are disabled by default (opt in
 * per project); the remaining rules are non-blocking warnings.
 */
export const DEFAULT_LINT_RULES: ToolchainOxlintConfig = {
    ignorePatterns: [...DEFAULT_LINT_IGNORE_PATTERNS],
    rules: {
        'jsx-a11y/alt-text': 'off',
        'jsx-a11y/aria-props': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'react/button-has-type': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/exhaustive-deps': 'off',
        'typescript/no-empty-object-type': 'off',
        'typescript/no-explicit-any': 'off',
        'typescript/no-non-null-assertion': 'off',
        'typescript/no-useless-empty-export': 'off',
        eqeqeq: 'warn',
        'import/no-duplicates': 'warn',
        'no-alert': 'warn',
        'no-case-declarations': 'off',
        'no-console': 'off',
        'no-constant-condition': 'off',
        'no-control-regex': 'off',
        'no-debugger': 'warn',
        'no-inner-declarations': 'off',
        'no-return-assign': 'off',
        'no-unused-vars': 'warn',
        'no-useless-escape': 'off',
        'no-var': 'warn',
        'prefer-const': 'warn',
        'prefer-exponentiation-operator': 'off',
        'prefer-template': 'off',
    },
};
