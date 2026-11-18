import type { ChangelogBreakingSetting } from '@deltabox/toolchain/shared';

import type {
    AuthorInfo,
    ChangelogGroupsSetting,
    CommitFormatOptions,
    CommitRecord,
    GroupedItem,
} from '../types/index.js';
import { isBreakingCommit } from './breaking.js';
import {
    detailsEnabled,
    renderDetails,
    resolveDetails,
    wrapCustomDetails,
    type ResolvedDetails,
} from './details.js';
import { capitalize, formatBody, groupItems, parseCcSubject, renderGroups } from './format.js';
import {
    prefetchGitHubMetadata,
    readPriorAuthors,
    recordIssues,
    renderAuthor,
    renderIssues,
    repoSlug,
    resolveAuthorInfo,
} from './git.js';

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
    /**
     * The scanned git range. Used to detect first-time contributors by looking
     * for their authors before the range starts.
     */
    range?: string;
    /**
     * Explicit prior-contributor keys (author name/email), for tests or callers
     * that already know the history. When omitted, the range is inspected.
     */
    priorAuthors?: Iterable<string>;
    /** Commit line formatting/credit options. */
    commit?: CommitFormatOptions;
    /** Conventional-Commits group order/titles/hiding. */
    groups?: ChangelogGroupsSetting;
    /** How breaking changes are detected (default: Conventional Commits). */
    breaking?: ChangelogBreakingSetting;
    /** Whether this is the release-mode changelog (Release Notes details). */
    release?: boolean;
}

type BumpGroup = 'major' | 'minor' | 'patch';

const BUMP_GROUPS: BumpGroup[] = ['major', 'minor', 'patch'];
const BUMP_TITLES: Record<BumpGroup, string> = {
    major: 'Major changes',
    minor: 'Minor changes',
    patch: 'Patch changes',
};

/** Which coarse bump bucket a commit belongs to (no commitlint required). */
function bumpGroupOf(record: CommitRecord, breaking?: ChangelogBreakingSetting): BumpGroup {
    const parsed = parseCcSubject(record.subject);
    if (isBreakingCommit(record, breaking)) return 'major';
    return parsed.type === 'feat' ? 'minor' : 'patch';
}

interface CommitItemOptions {
    /** Include the `by <author>` credit (default true). */
    author?: boolean;
    /** Include the commit body as nested bullets (default true). */
    body?: boolean;
    /** How breaking changes are detected (default: Conventional Commits). */
    breaking?: ChangelogBreakingSetting;
}

/** Build a commit bullet, shared by the grouped and fallback summaries. */
function commitItem(
    record: CommitRecord,
    repo: string | undefined,
    options: CommitItemOptions & CommitFormatOptions = {}
): GroupedItem {
    const parsed = parseCcSubject(record.subject);
    const author = resolveAuthorInfo(record, repo);
    const issues = recordIssues(record, repo);
    let text: string;
    if (options.format) {
        text = `- ${options.format({ commit: record, repo, author, issues, options })}`;
    } else {
        const credit: string[] = [];
        if (options.commitSha !== false) credit.push(renderCommitRef(repo, record.hash));
        if (options.author !== false) {
            const avatar =
                options.authorAvatar && author.url ? `![${author.name}](${author.url}) ` : '';
            credit.push(`by ${avatar}${renderAuthor(author)}`);
        }
        const creditText = credit.length > 0 ? ` (${credit.join(' ')})` : '';
        const issueText = options.issues === false ? '' : renderIssues(issues);
        text = `- ${capitalize(parsed.rest)}${creditText}${issueText}`;
    }
    return {
        parsed,
        breaking: isBreakingCommit(record, options.breaking),
        text,
        bodyParagraphs: options.body === false ? [] : formatBody(record.body),
    };
}

function renderItem(item: GroupedItem, details?: ResolvedDetails): string[] {
    const lines = [item.text];
    if (item.bodyParagraphs.length === 0) return lines;
    const body: string[] = [];
    for (const paragraph of item.bodyParagraphs) {
        const [first, ...rest] = paragraph;
        if (!first) continue;
        body.push(`  - ${first}`);
        body.push(...rest.map(line => `    ${line}`));
    }
    if (
        details?.enabled &&
        details.descriptions.enabled &&
        detailsEnabled(details.descriptions, item.bodyParagraphs.length)
    ) {
        const title = details.descriptions.title ?? '**See more...**';
        lines.push(
            ...renderDetails(title, body.join('\n'), details.descriptions.expanded === true)
                .split('\n')
                .map(line => (line ? `  ${line}` : line))
        );
    } else {
        lines.push(...body);
    }
    return lines;
}

/** The coarse fallback summary used when commitlint is disabled. */
function buildFallbackSummary(
    records: CommitRecord[],
    commit?: CommitFormatOptions,
    breaking?: ChangelogBreakingSetting,
    details?: ResolvedDetails
): string {
    const repo = repoSlug();
    const groups = new Map<BumpGroup, GroupedItem[]>();
    for (const record of records) {
        const group = bumpGroupOf(record, breaking);
        const bucket = groups.get(group) ?? [];
        bucket.push(commitItem(record, repo, { ...commit, breaking }));
        groups.set(group, bucket);
    }
    if (groups.size === 0) return '- No description provided.';

    const lines: string[] = [];
    for (const group of BUMP_GROUPS) {
        const items = groups.get(group);
        if (!items || items.length === 0) continue;
        if (lines.length > 0) lines.push('');
        lines.push(`### ${BUMP_TITLES[group]}`);
        for (const item of items) lines.push(...renderItem(item, details));
    }
    return lines.join('\n');
}

function normalizeAuthorKey(value: string): string {
    return value.trim().toLowerCase();
}

function authorKeys(record: CommitRecord): string[] {
    return [record.authorEmail, record.author]
        .map(normalizeAuthorKey)
        .filter((key): key is string => key.length > 0);
}

interface Contributor {
    key: string;
    author: AuthorInfo;
    commits: CommitRecord[];
}

/** Detect contributors whose first commit is in the scanned range. */
function findNewContributors(
    records: CommitRecord[],
    repo: string | undefined,
    options: BuildSummaryOptions
): Contributor[] {
    let prior: Set<string> | undefined;
    if (options.priorAuthors !== undefined) {
        prior = new Set([...options.priorAuthors].map(normalizeAuthorKey));
    } else if (options.range) {
        const oldest = records[records.length - 1]?.hash;
        prior = readPriorAuthors(options.range, oldest);
    }
    if (!prior) return [];

    const contributors = new Map<string, Contributor>();
    for (const record of records) {
        const keys = authorKeys(record);
        if (keys.length === 0 || keys.some(key => prior.has(key))) continue;
        const key = keys[0]!;
        const existing = contributors.get(key);
        if (existing) {
            existing.commits.push(record);
        } else {
            contributors.set(key, {
                key,
                author: resolveAuthorInfo(record, repo),
                commits: [record],
            });
        }
    }
    return [...contributors.values()].sort((a, b) => a.author.name.localeCompare(b.author.name));
}

/** Render the `New contributors` footer, or '' when there are none. */
function renderNewContributors(
    records: CommitRecord[],
    repo: string | undefined,
    options: BuildSummaryOptions
): string {
    const contributors = findNewContributors(records, repo, options);
    if (contributors.length === 0) return '';
    const lines = ['### New contributors'];
    for (const contributor of contributors) {
        lines.push(`- ${renderAuthor(contributor.author)}`);
        for (const record of contributor.commits) {
            // Reuse the commit bullet formatting, but not the author (the
            // contributor heading already names them) or the long description.
            // Indent it under the contributor, like a nested list.
            lines.push(
                ...renderItem(commitItem(record, repo, { author: false, body: false })).map(
                    line => `  ${line}`
                )
            );
        }
    }
    return lines.join('\n');
}

/** Render the grouped changelog summary for a set of commits. */
export function buildSummary(records: CommitRecord[], options: BuildSummaryOptions = {}): string {
    const repo = repoSlug();
    // Resolve GitHub metadata in batched requests before rendering any commit.
    prefetchGitHubMetadata({
        ...(repo !== undefined ? { repo } : {}),
        ...(options.range !== undefined ? { range: options.range } : {}),
        commits: records,
    });
    const resolved = resolveDetails(options.commit?.details, options.release === true);
    // `lifecycle: 'after'` applies details to the fully formatted entry instead.
    const details = resolved.lifecycle === 'after' ? resolveDetails(false) : resolved;
    const summary =
        options.commitlint === false
            ? buildFallbackSummary(records, options.commit, options.breaking, details)
            : renderGroups(
                  groupItems(
                      records.map(record => {
                          // The CC rule + scope live in the nested group headings, so the
                          // commit line carries just the (capitalized) subject + credit.
                          return commitItem(record, repo, {
                              ...options.commit,
                              ...(options.breaking !== undefined
                                  ? { breaking: options.breaking }
                                  : {}),
                          });
                      }),
                      options.groups
                  ),
                  details
              );
    const contributors = renderNewContributors(records, repo, options);
    const body = contributors ? `${summary}\n\n${contributors}` : summary;
    const custom = wrapCustomDetails(body, details);
    if (
        details.enabled &&
        details.releaseNotes.enabled &&
        detailsEnabled(details.releaseNotes, records.length)
    ) {
        return renderDetails(
            details.releaseNotes.title ?? '**Release Notes**',
            custom,
            details.releaseNotes.expanded === true
        );
    }
    return custom;
}
