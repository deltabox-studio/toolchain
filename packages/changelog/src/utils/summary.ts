import { capitalize, formatBody, groupItems, parseCcSubject, renderGroups } from './format.js';
import { recordIssues, renderAuthor, renderIssues, repoSlug, resolveAuthorInfo } from './git.js';
import type { CommitRecord } from './types.js';

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

/** Render the grouped changelog summary for a set of commits. */
export function buildSummary(records: CommitRecord[]): string {
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
