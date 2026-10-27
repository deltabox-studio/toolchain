import { capitalize, formatBody, groupItems, parseCcSubject, renderGroups } from './format.js';
import { recordIssues, renderAuthor, renderIssues, repoSlug, resolveAuthorInfo } from './git.js';
import type { CommitRecord, GroupedItem } from './types.js';

/**
 * Render a commit reference for a changelog bullet. With a resolvable repo slug
 * it is a Markdown link to the commit; without one (no GitHub remote and no
 * GitHub `repository.url` in the root package.json) it degrades to a plain
 * short hash rather than a broken `github.com/undefined/...` link.
 */
export function renderCommitRef(repo: string | undefined, hash: string): string {
    const shortHash = hash.slice(0, 7);
    return repo ? `[#${shortHash}](https://github.com/${repo}/commit/${hash})` : `#${shortHash}`;
}

export interface BuildSummaryOptions {
    /**
     * Use the Conventional-Commits grouping (default true). When commitlint is
     * disabled, commits are hoisted into coarse Major/Minor/Patch buckets
     * instead, so a non-CC history still produces a readable changelog.
     */
    commitlint?: boolean;
}

type BumpGroup = 'major' | 'minor' | 'patch';

const BUMP_GROUPS: BumpGroup[] = ['major', 'minor', 'patch'];
const BUMP_TITLES: Record<BumpGroup, string> = {
    major: 'Major changes',
    minor: 'Minor changes',
    patch: 'Patch changes',
};

/** Which coarse bump bucket a commit belongs to (no commitlint required). */
function bumpGroupOf(record: CommitRecord): BumpGroup {
    const parsed = parseCcSubject(record.subject);
    if (
        parsed.breaking ||
        /BREAKING[ -]CHANGE/i.test(record.body) ||
        /^[a-zA-Z][a-zA-Z0-9]*(\([^)]*\))?!:\s/.test(record.subject)
    ) {
        return 'major';
    }
    return parsed.type === 'feat' ? 'minor' : 'patch';
}

function renderItem(item: GroupedItem): string[] {
    const lines = [item.text];
    for (const paragraph of item.bodyParagraphs) {
        const [first, ...rest] = paragraph;
        if (!first) continue;
        lines.push(`  - ${first}`);
        lines.push(...rest.map(line => `    ${line}`));
    }
    return lines;
}

/** The coarse fallback summary used when commitlint is disabled. */
function buildFallbackSummary(records: CommitRecord[]): string {
    const repo = repoSlug();
    const groups = new Map<BumpGroup, GroupedItem[]>();
    for (const record of records) {
        const parsed = parseCcSubject(record.subject);
        const authorText = renderAuthor(resolveAuthorInfo(record, repo));
        const text = `- ${capitalize(parsed.rest)} (${renderCommitRef(repo, record.hash)} by ${authorText})${renderIssues(recordIssues(record, repo))}`;
        const group = bumpGroupOf(record);
        const bucket = groups.get(group) ?? [];
        bucket.push({ parsed, text, bodyParagraphs: formatBody(record.body) });
        groups.set(group, bucket);
    }
    if (groups.size === 0) return '- No description provided.';

    const lines: string[] = [];
    for (const group of BUMP_GROUPS) {
        const items = groups.get(group);
        if (!items || items.length === 0) continue;
        lines.push(`### ${BUMP_TITLES[group]}`);
        for (const item of items) lines.push(...renderItem(item));
    }
    return lines.join('\n');
}

/** Render the grouped changelog summary for a set of commits. */
export function buildSummary(records: CommitRecord[], options: BuildSummaryOptions = {}): string {
    if (options.commitlint === false) return buildFallbackSummary(records);

    const repo = repoSlug();
    const groups = groupItems(
        records.map(record => {
            const parsed = parseCcSubject(record.subject);
            const authorText = renderAuthor(resolveAuthorInfo(record, repo));
            // The CC rule + scope live in the nested group headings, so the
            // commit line carries just the (capitalized) subject + credit.
            const text = `- ${capitalize(parsed.rest)} (${renderCommitRef(repo, record.hash)} by ${authorText})${renderIssues(recordIssues(record, repo))}`;
            return { parsed, text, bodyParagraphs: formatBody(record.body) };
        })
    );
    return renderGroups(groups);
}
