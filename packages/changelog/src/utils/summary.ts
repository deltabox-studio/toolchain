import { capitalize, formatBody, groupItems, parseCcSubject, renderGroups } from './format.js';
import { recordIssues, renderAuthor, renderIssues, repoSlug, resolveAuthorInfo } from './git.js';
import type { CommitRecord } from './types.js';

/** Render the grouped changelog summary for a set of commits. */
export function buildSummary(records: CommitRecord[]): string {
    const repo = repoSlug();
    const groups = groupItems(
        records.map(record => {
            const parsed = parseCcSubject(record.subject);
            const shortHash = record.hash.slice(0, 7);
            const authorText = renderAuthor(resolveAuthorInfo(record, repo));
            // The CC rule + scope live in the nested group headings, so the
            // commit line carries just the (capitalized) subject + credit.
            const text = `- ${capitalize(parsed.rest)} ([#${shortHash}](https://github.com/${repo}/commit/${record.hash}) by ${authorText})${renderIssues(recordIssues(record, repo))}`;
            return { parsed, text, bodyParagraphs: formatBody(record.body) };
        })
    );
    return renderGroups(groups);
}
