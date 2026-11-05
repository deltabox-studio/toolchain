import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { DEFAULT_LINT_RULES } from '../src/index.js';

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

describe('DEFAULT_LINT_RULES', () => {
    it('only references rule names that exist in the vendored Oxlint schema', () => {
        const rules = schemaRules();
        for (const name of Object.keys(DEFAULT_LINT_RULES.rules ?? {})) {
            expect(rules, `unknown Oxlint rule "${name}"`).toHaveProperty(name);
        }
    });
});
