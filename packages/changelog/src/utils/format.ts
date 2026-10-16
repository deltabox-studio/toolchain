import { readFileSync, writeFileSync } from 'node:fs';

import { logger } from '@deltabox/toolchain-shared';

import type { GroupedItem, GroupedRule, ParsedCommit } from './types.js';

const RULE_TITLES: Record<string, string> = {
    feat: 'New features',
    fix: 'Bug fixes',
    refactor: 'Refactors',
    docs: 'Documentation',
    style: 'Styles',
    chore: 'Chores',
    test: 'Tests',
    perf: 'Performance',
    build: 'Build system',
    ci: 'CI',
    revert: 'Reverts',
    breaking: 'Breaking changes',
};

const RULE_ORDER = [
    'breaking',
    'feat',
    'fix',
    'perf',
    'refactor',
    'docs',
    'style',
    'test',
    'build',
    'ci',
    'chore',
    'revert',
];

export function ruleTitle(type: string): string {
    return RULE_TITLES[type] ?? RULE_TITLES[type.toLowerCase()] ?? 'Other changes';
}

/** Parse a Conventional-Commits subject into its parts. */
export function parseCcSubject(subject: string): ParsedCommit {
    const match = /^([a-zA-Z][a-zA-Z0-9]*)(\(([^)]*)\))?(!)?:\s*(.*)$/.exec(subject);
    if (!match) return { type: 'chore', breaking: false, rest: subject };
    return {
        type: match[1]!.toLowerCase(),
        scope: match[3]?.trim() || undefined,
        breaking: Boolean(match[4]),
        rest: match[5] ?? '',
    };
}

/** Group a list of parsed commits by CC rule, then by scope. */
export function groupItems(items: GroupedItem[]): GroupedRule[] {
    const rules = new Map<string, GroupedRule>();
    for (const item of items) {
        const { parsed } = item;
        const rule =
            rules.get(parsed.type) ??
            ({ title: ruleTitle(parsed.type), ungrouped: [], scopes: new Map() } as GroupedRule);
        if (parsed.scope) {
            const bucket = rule.scopes.get(parsed.scope) ?? [];
            bucket.push(item);
            rule.scopes.set(parsed.scope, bucket);
        } else {
            rule.ungrouped.push(item);
        }
        rules.set(parsed.type, rule);
    }
    return [...rules.entries()]
        .sort((a, b) => {
            const ai = RULE_ORDER.indexOf(a[0]);
            const bi = RULE_ORDER.indexOf(b[0]);
            return (ai === -1 ? RULE_ORDER.length : ai) - (bi === -1 ? RULE_ORDER.length : bi);
        })
        .map(([, rule]) => rule);
}

export function renderGroups(groups: GroupedRule[]): string {
    if (groups.length === 0) return '- No description provided.';
    const lines: string[] = [];
    for (const rule of groups) {
        lines.push(`### ${rule.title}`);
        for (const item of rule.ungrouped) {
            lines.push(item.text);
            lines.push(...renderParagraphs(item.bodyParagraphs));
        }
        for (const [scope, scopeItems] of rule.scopes) {
            lines.push(`#### ${scopeTitle(scope)}`);
            for (const item of scopeItems) {
                lines.push(item.text);
                lines.push(...renderParagraphs(item.bodyParagraphs));
            }
        }
    }
    return lines.join('\n');
}

/** Render description paragraphs as nested bullets (continuations indented under the bullet). */
function renderParagraphs(paragraphs: string[][]): string[] {
    const lines: string[] = [];
    for (const paragraph of paragraphs) {
        const [first, ...rest] = paragraph;
        if (!first) continue;
        lines.push(`  - ${first}`);
        lines.push(...rest.map(line => `    ${line}`));
    }
    return lines;
}

function scopeTitle(scope: string): string {
    return scope.charAt(0).toUpperCase() + scope.slice(1);
}

/** Uppercase the first letter of a sentence (no-op on empty input). */
export function capitalize(text: string): string {
    return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/**
 * Split a changelog bullet's trailing inline content (after the commit credit
 * suffix `([#<hash>](<url>) by <author>)` and an optional `(fixes ...)` block)
 * into a description, so it can be nested under the commit like the rest.
 */
export function splitInlineDescription(rest: string): { main: string; inline: string } {
    const idx = rest.lastIndexOf('([#');
    if (idx === -1) return { main: rest, inline: '' };
    const tail = rest.slice(idx);
    const match = /^(\(\[#[^\]]+\]\([^)]*\) by [^)]*\)\)?)(?:\(fixes [^)]*\)\)?)?/.exec(tail);
    if (!match) return { main: rest, inline: '' };
    const consumed = match[0] ?? '';
    return {
        main: rest.slice(0, idx) + consumed,
        inline: rest.slice(idx + consumed.length).trim(),
    };
}

/**
 * Split a commit body into description paragraphs and conventional footers
 * (`KEY: value` lines), skipping bullet/numbered lists and issue-only lines so
 * each commit's details are rendered as nested bullets rather than one long
 * line. Blank lines separate paragraphs.
 */
export function formatBody(body: string): string[][] {
    const paragraphs: string[][] = [];
    let current: string[] = [];
    for (const raw of body.split('\n')) {
        const trimmed = raw.trim();
        if (!trimmed) {
            if (current.length > 0) {
                paragraphs.push(current);
                current = [];
            }
            continue;
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^[0-9]+[.)]/.test(trimmed)) {
            continue;
        }
        // Issue-only lines (already captured in the commit's "(fixes ...)" suffix).
        const withoutIssueRefs = trimmed.replace(
            /(?:close[sd]?|fixe?s|fixed|resolves?|resolved)\b\s*:?\s*#\d+\s*[,;]?\s*/gi,
            ''
        );
        if (!withoutIssueRefs.trim()) continue;
        // Conventional footers: `BREAKING CHANGE: ...`, `Reviewed-by: ...`, ... Only
        // known footer tokens are treated as footers so a sentence like
        // "Revamp the js SDK: ..." isn't misread as one.
        const footer =
            /^(BREAKING CHANGE|Reviewed-by|Signed-off-by|Co-authored-by|Acked-by|Co-developed-by|Helped-by|Reported-by|Suggested-by|Tested-by|Cc):\s+(.+)$/i.exec(
                trimmed
            );
        if (footer && !/^(http|https)\b/.test(trimmed)) {
            if (current.length > 0) {
                paragraphs.push(current);
                current = [];
            }
            paragraphs.push([`**${(footer[1] ?? '').trim()}:** ${(footer[2] ?? '').trim()}`]);
            continue;
        }
        current.push(trimmed);
    }
    if (current.length > 0) paragraphs.push(current);
    return paragraphs;
}

function canonicalCommitUrl(repo: string, hash: string): string {
    return `https://github.com/${repo}/commit/${hash}`;
}

function canonicalIssueUrl(repo: string, number: string): string {
    return `https://github.com/${repo}/issues/${number}`;
}

/** Normalize `[#hash](url)` and raw `#hash` refs to the canonical commit link. */
function formatHashLinks(line: string, repo: string): string {
    const linked = line.replace(/\[(#[0-9a-fA-F]{6,40})\]\(([^)]*)\)/g, (_match, text: string) => {
        const short = text.replace('#', '').slice(0, 7);
        return `[#${short}](${canonicalCommitUrl(repo, short)})`;
    });
    return linked.replace(
        /(^|[^\w[])#([0-9a-fA-F]{7,40})(?![0-9a-fA-F])(?=[)\].,;:\s]|$)/g,
        (_match, pre: string, hash: string) => {
            const short = hash.slice(0, 7);
            return `${pre}[#${short}](${canonicalCommitUrl(repo, short)})`;
        }
    );
}

/** Normalize `[#N …](url)` and raw `#N` issue refs to the canonical issue link. */
function formatIssueLinks(line: string, repo: string): string {
    const linked = line.replace(
        /\[#(\d+)(?=[ \]])(?:[^\]]*)\]\([^)]*\)/g,
        (_match, number: string) => `[#${number}](${canonicalIssueUrl(repo, number)})`
    );
    return linked.replace(
        /(^|[^\w[])#(\d+)(?=[)\].,;:\s]|$)/g,
        (_match, pre: string, number: string) =>
            `${pre}[#${number}](${canonicalIssueUrl(repo, number)})`
    );
}

export function formatLine(line: string, repo: string | undefined): string {
    if (!repo) return line;
    let out = formatHashLinks(line, repo);
    out = formatIssueLinks(out, repo);
    return out;
}

/** Format every commit line in a changelog file (all versions, in place). */
export function formatChangelogFile(file: string, repo: string | undefined): void {
    if (!repo) return;
    const content = readFileSync(file, 'utf8');
    const formatted = content
        .split('\n')
        .map(line => formatLine(line, repo))
        .join('\n');
    if (formatted !== content) {
        writeFileSync(file, formatted, 'utf8');
        logger.info(`  formatted ${file}`);
    }
}
