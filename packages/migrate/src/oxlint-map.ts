/**
 * Biome -> Oxlint rule mapping.
 *
 * Oxlint has no official Biome migration (upstream keeps it out of scope), so
 * this module maintains a curated map from Biome rule paths to Oxlint rule
 * names. Rules without a known equivalent are reported as `unmapped` rather than
 * silently dropped. Levels map `off`/`warn`/`error`; Biome's `info` has no Oxlint
 * equivalent and is downgraded to `off`.
 */

import type { UnmappedItem } from './types.js';

type Json = Record<string, any>;

/**
 * Biome rule path -> Oxlint rule name. `null` means "no known equivalent".
 * Bare names are core ESLint rules; prefixed names use an Oxlint plugin.
 */
export const RULE_MAP: Record<string, string | null> = {
    'a11y.useAltText': 'jsx-a11y/alt-text',
    'a11y.useButtonType': 'react/button-has-type',
    'a11y.useKeyWithClickEvents': 'jsx-a11y/click-events-have-key-events',
    'a11y.noSvgWithoutTitle': null,
    'a11y.useAriaPropsForRole': null,
    'a11y.useFocusableInteractive': null,
    'a11y.useSemanticElements': 'jsx-a11y/prefer-tag-over-role',
    'a11y.noStaticElementInteractions': null,
    'a11y.noLabelWithoutControl': 'jsx-a11y/label-has-associated-control',
    'complexity.noBannedTypes': 'typescript/no-empty-object-type',
    'complexity.noUselessEmptyExport': 'typescript/no-useless-empty-export',
    'complexity.noUselessEscapeInRegex': 'no-useless-escape',
    'complexity.noImportantStyles': null,
    'complexity.noStaticOnlyClass': 'unicorn/no-static-only-class',
    'correctness.noConstantCondition': 'no-constant-condition',
    'correctness.noInnerDeclarations': 'no-inner-declarations',
    'correctness.noUnusedVariables': 'no-unused-vars',
    'correctness.noUnusedFunctionParameters': 'no-unused-vars',
    'correctness.noUnusedImports': 'no-unused-vars',
    'correctness.noSwitchDeclarations': 'no-case-declarations',
    'correctness.useExhaustiveDependencies': 'react-hooks/exhaustive-deps',
    'style.useExponentiationOperator': 'prefer-exponentiation-operator',
    'style.noNonNullAssertion': 'typescript/no-non-null-assertion',
    'style.useNodejsImportProtocol': 'unicorn/prefer-node-protocol',
    'style.useTemplate': 'prefer-template',
    'suspicious.noDoubleEquals': 'eqeqeq',
    'suspicious.noExplicitAny': 'typescript/no-explicit-any',
    'suspicious.noAssignInExpressions': 'no-return-assign',
    'suspicious.noUselessEscapeInString': 'no-useless-escape',
    'suspicious.noImplicitAnyLet': null,
    'suspicious.noUnknownAtRules': null,
    'performance.noAccumulatingSpread': 'oxc/no-accumulating-spread',
};

interface RuleSetting {
    level?: string;
    options?: unknown;
}

/** Normalize a Biome rule value to a level string. */
function levelOf(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return (value as RuleSetting).level;
    return undefined;
}

/** Map a Biome level to an Oxlint level (`info` -> `off`). */
function toOxlintLevel(level: string | undefined): 'off' | 'warn' | 'error' | undefined {
    if (level === 'error') return 'error';
    if (level === 'warn') return 'warn';
    if (level === 'info' || level === 'off') return 'off';
    return undefined;
}

export interface OxlintMapping {
    oxlint: Json;
    unmapped: UnmappedItem[];
}

/** Flatten Biome's nested rule groups into `group.rule` paths. */
function flattenRules(rules: Json): [string, unknown][] {
    const out: [string, unknown][] = [];
    for (const [group, value] of Object.entries(rules ?? {})) {
        if (value && typeof value === 'object') {
            for (const [rule, setting] of Object.entries(value as Json)) {
                out.push([`${group}.${rule}`, setting]);
            }
        }
    }
    return out;
}

/**
 * Build an `.oxlintrc.json` body from a Biome `linter` config. Only rules Biome
 * explicitly configures are translated (so Oxlint's own defaults apply
 * elsewhere), plus the migrated `files.includes` negations as `ignorePatterns`.
 */
export function mapBiomeToOxlint(biome: Json, ignorePatterns: string[]): OxlintMapping {
    const rules: Json = {};
    const unmapped: UnmappedItem[] = [];

    for (const [path, setting] of flattenRules(biome.linter?.rules ?? {})) {
        const level = toOxlintLevel(levelOf(setting));
        if (!level) continue;
        const target = RULE_MAP[path];
        if (target === undefined) {
            unmapped.push({
                source: `linter.rules.${path}`,
                reason: 'not in the Biome->Oxlint map',
            });
            continue;
        }
        if (target === null) {
            unmapped.push({ source: `linter.rules.${path}`, reason: 'no Oxlint equivalent' });
            continue;
        }
        rules[target] = level;
    }

    return {
        oxlint: {
            $schema: './node_modules/oxlint/configuration_schema.json',
            rules,
            ignorePatterns,
        },
        unmapped,
    };
}
