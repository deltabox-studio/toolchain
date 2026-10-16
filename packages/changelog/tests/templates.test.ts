import { describe, expect, it } from 'vitest';

import { renderCommitlintConfig } from '../src/index.js';

describe('renderCommitlintConfig', () => {
    it('keeps the enums expanded so Oxfmt cannot collapse them', () => {
        // A short scope list would fit on one line and be collapsed by Oxfmt if
        // the array were not held open by an inert comment — that collapse would
        // reformat the generated file and make `dbx sync --check` drift.
        const out = renderCommitlintConfig({ scopes: ['core', 'ci'] });
        expect(out).toContain(
            "                // allowed commit scopes\n                'core',\n                'ci',"
        );
    });

    it('renders the configured types + scopes', () => {
        const out = renderCommitlintConfig({ types: ['feat'], scopes: ['api'] });
        expect(out).toContain('// allowed commit types');
        expect(out).toContain("                'feat',");
        expect(out).toContain('// allowed commit scopes');
        expect(out).toContain("                'api',");
    });
});
