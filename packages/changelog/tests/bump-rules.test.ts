import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { ChangelogBumpRuleCallbackContext } from '@deltabox/toolchain/shared';

import type { CommitRecord } from '../src/index.js';
import { bumpRulesFor, deriveCustomBump } from '../src/index.js';

function commit(subject: string, body = ''): CommitRecord {
    return {
        hash: subject.slice(0, 7),
        subject,
        body,
        author: 'a',
        authorEmail: 'a@b.c',
    };
}

describe('deriveCustomBump', () => {
    it('falls back to Conventional Commits without rules', () => {
        expect(deriveCustomBump([commit('fix: x')])).toBe('patch');
        expect(deriveCustomBump([commit('feat: x')])).toBe('minor');
        expect(deriveCustomBump([commit('feat!: x')])).toBe('major');
        expect(deriveCustomBump([commit('chore: x', 'BREAKING CHANGE: x')])).toBe('major');
    });

    it('replaces Conventional Commits as soon as a rule is present', () => {
        // A breaking feat is only minor because no major rule is configured.
        expect(deriveCustomBump([commit('feat!: x')], { minor: { type: 'feat' } })).toBe('minor');
        // A non-breaking feat does not bump by itself when only major is matched.
        expect(deriveCustomBump([commit('feat: x')], { major: { breaking: true } })).toBe('patch');
    });

    it('uses the highest matching level', () => {
        const rules = {
            major: { breaking: true },
            minor: { type: 'feat' },
        };
        expect(deriveCustomBump([commit('feat: x')], rules)).toBe('minor');
        expect(deriveCustomBump([commit('feat!: x')], rules)).toBe('major');
    });

    it('disables a level with false', () => {
        expect(
            deriveCustomBump([commit('feat!: x')], { major: false, minor: { type: 'feat' } })
        ).toBe('minor');
        expect(deriveCustomBump([commit('feat: x')], { minor: false })).toBe('patch');
    });

    it('always produces at least a patch bump', () => {
        expect(
            deriveCustomBump([commit('docs: x')], {
                major: false,
                minor: false,
                patch: false,
            })
        ).toBe('patch');
        expect(deriveCustomBump([commit('docs: x')], {})).toBe('patch');
    });

    it('treats breaking:false as a non-breaking matcher', () => {
        const rules = { minor: { breaking: false } };
        expect(deriveCustomBump([commit('feat: x')], rules)).toBe('minor');
        expect(deriveCustomBump([commit('feat!: x')], rules)).toBe('patch');
        expect(deriveCustomBump([commit('fix: x')], rules)).toBe('minor');
    });

    it('matches any rule in an array', () => {
        const rules = { minor: [{ type: 'feat' }, /^feat\(ui\)/] };
        expect(deriveCustomBump([commit('feat: x')], rules)).toBe('minor');
        expect(deriveCustomBump([commit('feat(ui): x')], rules)).toBe('minor');
        expect(deriveCustomBump([commit('fix: x')], rules)).toBe('patch');
    });

    it('passes the evaluated level to callbacks, including array entries', () => {
        const levels: Array<string | undefined> = [];
        const bump = deriveCustomBump([commit('x')], {
            major: [
                (ctx: ChangelogBumpRuleCallbackContext) => {
                    levels.push(ctx.level);
                    return ctx.level === 'major' ? 'major' : false;
                },
            ],
        });

        expect(levels).toEqual(['major']);
        expect(bump).toBe('major');
    });

    it('escalates once per extra matching change with allowOverBump', () => {
        const records = [commit('docs: a'), commit('docs: b')];
        const rules = { minor: { type: 'docs' } };

        expect(deriveCustomBump(records, rules, false)).toBe('minor');
        expect(deriveCustomBump(records, rules, true)).toBe('major');
    });

    it('counts one commit once even when it matches several levels', () => {
        const rules = { minor: { type: 'docs' }, patch: { type: 'docs' } };

        expect(deriveCustomBump([commit('docs: a')], rules, true)).toBe('minor');
    });
});

describe('bumpRulesFor', () => {
    let root: string;

    afterEach(() => {
        rmSync(root, { recursive: true, force: true });
    });

    it('does not treat a non-matching targeted rule as a match-all matcher', () => {
        root = mkdtempSync(join(tmpdir(), 'dbx-bump-rules-'));
        const workspace = join(root, 'packages', 'a');
        mkdirSync(workspace, { recursive: true });
        const rules = {
            minor: [{ target: 'packages/a', options: { type: 'feat' } }],
        };

        // Before the fix this returned the `{ target, options }` array, which
        // `bumpRuleMatches` interpreted as an object matcher and matched
        // every commit at the minor level.
        expect(bumpRulesFor(rules, root, root)).toBeUndefined();
        expect(bumpRulesFor(rules, workspace, root)).toEqual({ minor: { type: 'feat' } });
    });

    it('keeps plain matcher arrays and targeted matches per level', () => {
        root = mkdtempSync(join(tmpdir(), 'dbx-bump-rules-'));
        const workspace = join(root, 'packages', 'a');
        mkdirSync(workspace, { recursive: true });

        expect(bumpRulesFor({ minor: [{ type: 'feat' }, /^feat/] }, root, root)).toEqual({
            minor: [{ type: 'feat' }, /^feat/],
        });
        expect(
            bumpRulesFor(
                {
                    major: false,
                    minor: [{ target: 'packages/a', options: { type: 'feat' } }],
                },
                root,
                root
            )
        ).toEqual({ major: false });
    });
});
