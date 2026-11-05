import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { applyFmtCustomGroups, DEFAULT_FMT_RULES, DEFAULT_LINT_RULES } from '../src/index.js';

/** The vendored Oxlint schema's rule-name map. */
function schemaRules(): Record<string, unknown> {
    const file = fileURLToPath(
        new URL('../src/config-schema/schemas/oxlint.json', import.meta.url)
    );
    const schema = JSON.parse(fs.readFileSync(file, 'utf8')) as {
        definitions?: { DummyRuleMap?: { properties?: Record<string, unknown> } };
    };
    return schema.definitions?.DummyRuleMap?.properties ?? {};
}

describe('DEFAULT_FMT_RULES', () => {
    it('sorts imports by default (the workspace group is resolved separately)', () => {
        const sortImports = DEFAULT_FMT_RULES.sortImports as { groups: string[] };
        expect(sortImports.groups).toEqual(expect.arrayContaining(['builtin', 'external']));
        expect(sortImports.groups).not.toContain('workspace');
        expect(DEFAULT_FMT_RULES.sortImports).toMatchObject({ customGroups: [] });
    });
});

describe('applyFmtCustomGroups', () => {
    const workspace = {
        groupName: 'workspace',
        elementNamePattern: ['@acme/**', 'app', 'app/**'],
    };

    it('adds the workspace group and lists it in groups', () => {
        const fmt = applyFmtCustomGroups({ ...DEFAULT_FMT_RULES }, [workspace]);
        const sortImports = fmt.sortImports as {
            groups: unknown[];
            customGroups: unknown[];
        };
        expect(sortImports.customGroups).toEqual([workspace]);
        expect(sortImports.groups).toContain('workspace');
    });

    it('keeps consumer custom groups and merges matching patterns', () => {
        const fmt = applyFmtCustomGroups(
            {
                ...DEFAULT_FMT_RULES,
                sortImports: {
                    groups: ['builtin', 'external'],
                    customGroups: [{ groupName: 'workspace', elementNamePattern: ['@other/**'] }],
                },
            },
            [workspace]
        );
        const sortImports = fmt.sortImports as {
            groups: unknown[];
            customGroups: Array<{ groupName?: string; elementNamePattern?: string[] }>;
        };
        expect(sortImports.customGroups).toHaveLength(1);
        expect(sortImports.customGroups[0]?.elementNamePattern).toEqual([
            '@other/**',
            '@acme/**',
            'app',
            'app/**',
        ]);
        expect(sortImports.groups).toEqual(['builtin', 'external', 'workspace']);
    });

    it('respects a disabled sortImports', () => {
        const fmt = { ...DEFAULT_FMT_RULES, sortImports: false as const };
        expect(applyFmtCustomGroups(fmt, [workspace])).toBe(fmt);
    });

    it('leaves a config without sortImports alone', () => {
        const fmt = { ...DEFAULT_FMT_RULES, sortImports: undefined };
        expect(applyFmtCustomGroups(fmt, [workspace])).toBe(fmt);
    });
});

describe('DEFAULT_LINT_RULES', () => {
    it('only references rule names that exist in the vendored Oxlint schema', () => {
        const rules = schemaRules();
        for (const name of Object.keys(DEFAULT_LINT_RULES.rules ?? {})) {
            expect(rules, `unknown Oxlint rule "${name}"`).toHaveProperty(name);
        }
    });
});
