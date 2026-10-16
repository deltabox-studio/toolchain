/**
 * Biome -> Oxfmt mapping.
 *
 * Oxfmt is Prettier-compatible and ships `sortImports` (perfectionist-based),
 * which is the analogue of Biome's `assist.actions.source.organizeImports`. This
 * module maps `formatter`/`javascript.formatter` options, `files.includes`
 * negations and `organizeImports.groups` to their Oxfmt equivalents, recording
 * anything that cannot be represented faithfully.
 */

import type { UnmappedItem } from './types.js';

type Json = Record<string, any>;

/** Default ignore globs added on top of the migrated negations. */
export const DEFAULT_IGNORE = ['**/node_modules/**', '**/dist/**', '**/.turbo/**'];

export interface OxfmtMapping {
    oxfmt: Json;
    unmapped: UnmappedItem[];
}

/** Map `formatter` + `javascript.formatter` to Oxfmt options. */
export function mapBiomeFormatter(biome: Json): OxfmtMapping {
    const formatter = biome.formatter ?? {};
    const js = biome.javascript?.formatter ?? {};
    const oxfmt: Json = {};
    const unmapped: UnmappedItem[] = [];

    if (formatter.indentStyle) oxfmt.useTabs = formatter.indentStyle === 'tab';
    if (typeof formatter.indentWidth === 'number') oxfmt.tabWidth = formatter.indentWidth;
    if (typeof formatter.lineWidth === 'number') oxfmt.printWidth = formatter.lineWidth;
    if (formatter.lineEnding && formatter.lineEnding !== 'auto')
        oxfmt.endOfLine = formatter.lineEnding;
    if (typeof formatter.bracketSameLine === 'boolean')
        oxfmt.bracketSameLine = formatter.bracketSameLine;
    if (typeof formatter.bracketSpacing === 'boolean')
        oxfmt.bracketSpacing = formatter.bracketSpacing;
    if (formatter.attributePosition === 'multiline') oxfmt.singleAttributePerLine = true;

    if (js.quoteStyle) oxfmt.singleQuote = js.quoteStyle === 'single';
    if (js.jsxQuoteStyle) oxfmt.jsxSingleQuote = js.jsxQuoteStyle === 'single';
    if (js.quoteProperties)
        oxfmt.quoteProps = js.quoteProperties === 'asNeeded' ? 'as-needed' : 'preserve';
    if (js.trailingCommas) oxfmt.trailingComma = js.trailingCommas;
    if (js.semicolons) oxfmt.semi = js.semicolons === 'always';
    if (js.arrowParentheses)
        oxfmt.arrowParens = js.arrowParentheses === 'always' ? 'always' : 'avoid';

    // Biome options with no faithful Oxfmt equivalent, each probed in the
    // section it actually lives in. `expand`/`useEditorconfig`/
    // `formatWithErrors` are top-level `formatter` options, but `jsxQuoteStyle`
    // lives under `javascript.formatter` (`js`) — probing `formatter` for it
    // never matches, so it used to go unreported.
    const unmappedKeys: [source: string, container: Json, key: string][] = [
        ['formatter.expand', formatter, 'expand'],
        ['formatter.useEditorconfig', formatter, 'useEditorconfig'],
        ['formatter.formatWithErrors', formatter, 'formatWithErrors'],
        ['javascript.formatter.jsxQuoteStyle', js, 'jsxQuoteStyle'],
    ];
    for (const [source, container, key] of unmappedKeys) {
        if (key in container) unmapped.push({ source, reason: 'no Oxfmt equivalent' });
    }
    return { oxfmt, unmapped };
}

/** Turn Biome `files.includes` negations into Oxfmt `ignorePatterns`. */
export function mapBiomeIncludes(biome: Json): string[] {
    const includes: unknown[] = biome.files?.includes ?? [];
    const negations = includes
        .filter((value): value is string => typeof value === 'string' && value.startsWith('!'))
        .map(value => value.slice(1));
    return [...new Set([...DEFAULT_IGNORE, ...negations])];
}

/** Biome `organizeImports` group selectors, most specific first. */
const SELECTOR_MAP: Record<string, string | string[]> = {
    ':NODE:': 'builtin',
    ':BUN:': 'builtin',
    ':PACKAGE:': 'external',
    ':ALIAS:': 'internal',
    ':PATH:': ['parent', 'sibling', 'index'],
};

function looksLikeAlias(pattern: string): boolean {
    return /^[@~#][\w-]*\/?/.test(pattern) || pattern.endsWith('/**');
}

/**
 * Map `assist.actions.source.organizeImports.options.groups` to Oxfmt
 * `sortImports`. Aliases become `internalPattern`, other literals become
 * `customGroups`, and shorthand selectors map through {@link SELECTOR_MAP}.
 */
export function mapOrganizeImports(groups: unknown): {
    sortImports: Json;
    unmapped: UnmappedItem[];
} {
    const unmapped: UnmappedItem[] = [];
    const outGroups: (string | string[])[] = [];
    const customGroups: Json[] = [];
    const internalPattern = new Set<string>(['~/', '@/']);

    const asArray = Array.isArray(groups) ? groups : [];
    for (const entry of asArray) {
        if (entry === ':BLANK_LINE:') continue;
        const tokens = Array.isArray(entry) ? entry : [entry];
        const mapped: string[] = [];
        for (const token of tokens) {
            if (typeof token !== 'string') continue;
            if (token in SELECTOR_MAP) {
                const value = SELECTOR_MAP[token];
                if (!value) continue;
                for (const one of Array.isArray(value) ? value : [value]) mapped.push(one);
                continue;
            }
            if (token.startsWith(':')) {
                unmapped.push({
                    source: `organizeImports ${token}`,
                    reason: 'unknown Biome selector',
                });
                continue;
            }
            if (token.startsWith('!')) {
                unmapped.push({
                    source: `organizeImports ${token}`,
                    reason: 'negated group members are approximated',
                });
                continue;
            }
            if (looksLikeAlias(token)) {
                const prefix = token.replace(/\*+.*$/, '');
                if (prefix) internalPattern.add(prefix);
                mapped.push('internal');
                continue;
            }
            const groupName = `custom${customGroups.length}`;
            customGroups.push({ groupName, elementNamePattern: [token] });
            mapped.push(groupName);
        }
        const unique = [...new Set(mapped)];
        if (unique.length) outGroups.push(unique.length === 1 ? unique[0]! : unique);
    }

    // Collapse consecutive duplicates (eg. several alias groups -> `internal`).
    const collapsed: (string | string[])[] = [];
    for (const group of outGroups) {
        const prev = collapsed[collapsed.length - 1];
        if (prev !== undefined && JSON.stringify(prev) === JSON.stringify(group)) continue;
        collapsed.push(group);
    }

    const sortImports: Json = {
        groups: collapsed,
        internalPattern: [...internalPattern],
        newlinesBetween: true,
        // Biome does not sort package.json; keep Oxfmt's default off here.
        sortPackageJson: false,
    };
    if (customGroups.length) sortImports.customGroups = customGroups;
    return { sortImports, unmapped };
}

/** Build the complete Oxfmt config from a Biome config. */
export function mapBiomeToOxfmt(biome: Json): OxfmtMapping {
    const formatter = mapBiomeFormatter(biome);
    const oxfmt: Json = { ...formatter.oxfmt, ignorePatterns: mapBiomeIncludes(biome) };
    const unmapped = [...formatter.unmapped];

    const organize = biome.assist?.actions?.source?.organizeImports;
    if (organize) {
        const groups = organize.options?.groups;
        if (groups) {
            const mapped = mapOrganizeImports(groups);
            oxfmt.sortImports = mapped.sortImports;
            unmapped.push(...mapped.unmapped);
        }
    }
    return { oxfmt, unmapped };
}
