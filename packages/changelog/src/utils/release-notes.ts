import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { publishedReleaseTags } from './git.js';
import { repoRoot } from './repo.js';
import { isPrereleaseVersion } from './version.js';

interface ChangelogEntry {
    version: string;
    /** Start of the whole entry (heading included). */
    start: number;
    /** Start of the entry body (after the heading line). */
    bodyStart: number;
    /** End of the entry (the next heading, or the file end). */
    end: number;
    /** The v2 legacy `<details><summary><h2>...` heading wrapper. */
    legacyDetails: boolean;
}

/** Normalize a tag to its semver version (`v1.2.3`, `@scope/pkg@1.2.3-beta.1` -> `1.2.3-beta.1`). */
export function normalizeReleaseVersion(tag: string): string | undefined {
    const match = /(?:^|@)v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag.trim());
    return match?.[1];
}

/** The `## <version>` and legacy `<details><summary><h2>` entries, newest first. */
function changelogEntries(changelog: string): ChangelogEntry[] {
    const headings: Array<Omit<ChangelogEntry, 'bodyStart' | 'end'>> = [];
    const patterns = [
        {
            legacyDetails: false,
            regex: /^##\s+(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?:\s|$)/gm,
        },
        {
            legacyDetails: true,
            regex: /^<details>\n\n?<summary><h2>(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?:\s*\([^)]*\))?<\/h2><\/summary>/gm,
        },
    ];
    for (const { regex, legacyDetails } of patterns) {
        for (const match of changelog.matchAll(regex)) {
            if (match.index === undefined) continue;
            headings.push({
                version: match[1]!,
                start: match.index,
                legacyDetails,
            });
        }
    }
    headings.sort((a, b) => a.start - b.start);
    return headings.map((heading, index) => {
        let bodyStart = heading.start;
        // Re-find the heading end without re-running the regex on the file.
        const next = headings[index + 1]?.start ?? changelog.length;
        const lineEnd = changelog.indexOf('\n', heading.start);
        bodyStart = lineEnd === -1 ? next : lineEnd + 1;
        while (bodyStart < next && /[\r\n]/.test(changelog[bodyStart]!)) bodyStart += 1;
        return {
            ...heading,
            bodyStart,
            end: next,
        };
    });
}

const RELEASE_START = '<!-- release:start -->';
const RELEASE_END = '<!-- release:end -->';

/** The release body of one changelog entry (markers stripped, heading excluded). */
function entryBody(changelog: string, entry: ChangelogEntry): string {
    let body = changelog.slice(entry.bodyStart, entry.end);
    const start = body.indexOf(RELEASE_START);
    const end = body.indexOf(RELEASE_END);
    if (start !== -1 && end > start) {
        body = body.slice(start + RELEASE_START.length, end);
    } else {
        body = body.replaceAll(RELEASE_START, '').replaceAll(RELEASE_END, '');
    }
    if (entry.legacyDetails) body = body.replace(/<\/details>\s*$/, '');
    return body.trim();
}

interface DetailsBlock {
    /** Stable merge key (the summary text without HTML). */
    key: string;
    /** The original `<summary>...</summary>` line. */
    summary: string;
    /** The block body (everything after the summary line). */
    body: string;
}

/** Split a body into non-details text and top-level `<details>` blocks. */
function splitDetails(body: string): { text: string; details: DetailsBlock[] } {
    const lines = body.split('\n');
    const textLines: string[] = [];
    const details: DetailsBlock[] = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index]!;
        if (line.trim() !== '<details>') {
            textLines.push(line);
            index += 1;
            continue;
        }
        const chunk: string[] = [];
        let depth = 0;
        for (; index < lines.length; index += 1) {
            const current = lines[index]!;
            chunk.push(current);
            depth += (current.match(/<details\b/g) ?? []).length;
            depth -= (current.match(/<\/details>/g) ?? []).length;
            if (depth === 0) {
                index += 1;
                break;
            }
        }
        const summaryIndex = chunk.findIndex(current => current.includes('<summary>'));
        if (summaryIndex === -1) {
            textLines.push(...chunk);
            continue;
        }
        const summary = chunk[summaryIndex]!.trim();
        details.push({
            key: summary
                .replace(/<[^>]+>/g, '')
                .trim()
                .toLowerCase(),
            summary,
            body: chunk
                .slice(summaryIndex + 1, -1)
                .join('\n')
                .trim(),
        });
    }
    return { text: textLines.join('\n').trim(), details };
}

/**
 * Keep only the first `### Package changes` section and drop the duplicates
 * that follow it.
 *
 * Each version's entry has its own footer comparing against the version before
 * it; in a grouped release the newest footer already covers the whole range, so
 * older duplicates would otherwise repeat the section (and show stale diffs).
 * The duplicate heading and its content are removed up to the next heading or
 * the end of the enclosing details block.
 */
function keepFirstPackageChanges(body: string): string {
    const lines = body.split('\n');
    const out: string[] = [];
    let seen = false;
    let index = 0;
    while (index < lines.length) {
        const line = lines[index]!;
        if (!/^###\s+Package changes\s*$/.test(line)) {
            out.push(line);
            index += 1;
            continue;
        }
        if (!seen) {
            seen = true;
            out.push(line);
            index += 1;
            continue;
        }
        let depth = 0;
        index += 1;
        for (; index < lines.length; index += 1) {
            const current = lines[index]!;
            const opens = (current.match(/<details\b/g) ?? []).length;
            const closes = (current.match(/<\/details>/g) ?? []).length;
            if (depth === 0 && (/^###\s+/.test(current) || (closes > 0 && opens === 0))) {
                break;
            }
            depth += opens - closes;
        }
        // Resume at the boundary line (a heading or a closing `</details>`)
        // instead of swallowing it with the duplicate section.
    }
    return out
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Split a terminal `### Package changes` footer from a body's plain text. */
function splitPackageChanges(text: string): { text: string; footer: string } {
    const lines = text.split('\n');
    const index = lines.findIndex(line => /^###\s+Package changes\s*$/.test(line));
    if (index === -1) return { text: text.trim(), footer: '' };
    return {
        text: lines.slice(0, index).join('\n').trim(),
        footer: lines.slice(index).join('\n').trim(),
    };
}

/**
 * Merge several version bodies into one release body.
 *
 * The commits in a range may span multiple changelog entries (for example
 * `beta.8`, `beta.9` and `beta.10` before the next stable release). Release
 * bodies should read as one version, so equal summary groups are merged and
 * duplicate preamble text is dropped. Repeated `Package changes` footers are
 * collapsed to the newest one (the cumulative diff) and kept last: the footer
 * belongs after the grouped sections, never in the preamble.
 */
function mergeBodies(bodies: string[]): string {
    const text: string[] = [];
    const seenText = new Set<string>();
    const footers: string[] = [];
    const order: string[] = [];
    const groups = new Map<string, { summary: string; bodies: string[] }>();
    for (const body of bodies) {
        const parsed = splitDetails(body);
        const sections = splitPackageChanges(parsed.text);
        if (sections.text && !seenText.has(sections.text)) {
            seenText.add(sections.text);
            text.push(sections.text);
        }
        if (sections.footer) footers.push(sections.footer);
        for (const block of parsed.details) {
            const existing = groups.get(block.key);
            if (existing) {
                existing.bodies.push(block.body);
            } else {
                groups.set(block.key, { summary: block.summary, bodies: [block.body] });
                order.push(block.key);
            }
        }
    }
    const parts: string[] = [];
    if (text.length > 0) parts.push(text.join('\n\n'));
    for (const key of order) {
        const group = groups.get(key)!;
        parts.push(
            [
                '<details>',
                group.summary,
                '',
                group.bodies.filter(Boolean).join('\n\n'),
                '',
                '</details>',
            ].join('\n')
        );
    }
    if (footers.length > 0) parts.push(footers.join('\n\n'));
    return keepFirstPackageChanges(parts.join('\n\n'));
}

/** Aggregation options for a release body. */
export interface ReleaseNotesOptions {
    /**
     * Group every version since the previous published release into one body.
     * Without it only the newest entry is used when the boundary is ambiguous.
     */
    group?: boolean;
    /**
     * Let a prerelease version act as the boundary even when the version being
     * released is stable.
     */
    includePrereleases?: boolean;
    /** Explicit lower boundary version/tag (overrides release discovery). */
    since?: string;
}

/**
 * Build the release body from a changelog and its candidate release versions.
 *
 * - Finds the newest released version that exists in the changelog (excluding
 *   the version being released) and combines every entry above it.
 * - With `group: true` a stable release ignores prerelease boundaries, so all
 *   prereleases since the last stable release become one body. A prerelease
 *   release still stops at the previous prerelease.
 * - When the version being released is not a heading yet, the newest entry is
 *   included instead of returning an empty body.
 * - With `group: true` and no previous published release (first release), every
 *   entry is grouped; without grouping only the newest entry is used.
 * - Returns only the content inside `<!-- release:start -->` /
 *   `<!-- release:end -->` when those markers are present, and never includes
 *   version headings.
 * - Returns '' when the changelog has no version headings.
 */
export function buildReleaseNotes(
    changelog: string,
    tagVersions: string[],
    currentVersion?: string,
    options: ReleaseNotesOptions = {}
): string {
    const entries = changelogEntries(changelog);
    if (entries.length === 0) return '';

    // Accept both `2.0.0` and `v2.0.0` as the version being released.
    const current = currentVersion
        ? (normalizeReleaseVersion(currentVersion) ?? currentVersion)
        : undefined;
    const currentIsHeading = entries.some(entry => entry.version === current);

    const versions = new Set(
        tagVersions
            .map(normalizeReleaseVersion)
            .filter((version): version is string => version !== undefined)
    );
    const grouping = options.group === true;
    // A stable release rolls every prerelease since the previous stable release
    // into one body. A prerelease release keeps prerelease boundaries, so each
    // beta only lists its own delta instead of repeating the whole cycle.
    const skipPrereleases =
        grouping &&
        options.includePrereleases !== true &&
        !(current !== undefined && isPrereleaseVersion(current));
    const boundaries = skipPrereleases
        ? new Set([...versions].filter(version => !isPrereleaseVersion(version)))
        : versions;

    // An explicit `since` wins over discovery when it names a changelog version.
    const since = options.since?.trim();
    const sinceVersion = since ? (normalizeReleaseVersion(since) ?? since) : undefined;
    const explicit = sinceVersion
        ? entries.find(entry => entry.version === sinceVersion && entry.version !== current)
        : undefined;

    const previous =
        explicit ??
        entries.find(entry => entry.version !== current && boundaries.has(entry.version));
    let selected: ChangelogEntry[];
    if (previous) {
        // Grouping always walks the whole range; without it, keep the legacy
        // guard that avoids re-exposing an already released newest entry.
        selected =
            grouping || currentIsHeading || previous !== entries[0]
                ? entries.slice(0, entries.indexOf(previous))
                : entries.slice(0, 1);
    } else if (grouping) {
        // No published boundary: the whole changelog is one release.
        selected = entries;
    } else {
        selected = entries.slice(0, 1);
    }
    const bodies = selected.map(entry => entryBody(changelog, entry)).filter(Boolean);
    return mergeBodies(bodies);
}

/** Options for {@link releaseNotesFromGit}. */
export interface ReleaseNotesFromGitOptions extends ReleaseNotesOptions {
    /** Override tag discovery (tests or callers with an existing tag list). */
    tags?: string[];
}

/** Read the release body from the repo's changelog + published releases/tags. */
export function releaseNotesFromGit(
    currentVersion: string,
    cwd = repoRoot(),
    options: ReleaseNotesFromGitOptions = {}
): string {
    const file = resolve(cwd, 'CHANGELOG.md');
    let changelog = '';
    if (existsSync(file)) {
        try {
            changelog = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
        } catch {
            changelog = '';
        }
    }
    let tagVersions = options.tags;
    if (tagVersions === undefined) {
        // Prefer the tags of published GitHub Releases so drafts and local-only
        // tags cannot bound the grouped body. Empty means "no releases yet", so
        // fall back to the local tags for a first-release/unsupported setup.
        const published = publishedReleaseTags();
        if (published && published.length > 0) {
            tagVersions = published;
        } else {
            const tags = spawnSync('git', ['tag', '--merged', 'HEAD', '--sort=-v:refname'], {
                cwd,
                encoding: 'utf8',
            });
            tagVersions = (tags.stdout ?? '').split(/\r?\n/).filter(Boolean);
        }
    }
    const notes = buildReleaseNotes(changelog, tagVersions, currentVersion, options);
    return notes || `Release ${currentVersion}`;
}
