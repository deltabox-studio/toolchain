import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { repoRoot } from './repo.js';

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
 * Merge several version bodies into one release body.
 *
 * The commits in a range may span multiple changelog entries (for example
 * `beta.8`, `beta.9` and `beta.10` before the next stable release). Release
 * bodies should read as one version, so equal summary groups are merged and
 * duplicate preamble text is dropped.
 */
function mergeBodies(bodies: string[]): string {
    const text: string[] = [];
    const seenText = new Set<string>();
    const order: string[] = [];
    const groups = new Map<string, { summary: string; bodies: string[] }>();
    for (const body of bodies) {
        const parsed = splitDetails(body);
        if (parsed.text && !seenText.has(parsed.text)) {
            seenText.add(parsed.text);
            text.push(parsed.text);
        }
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
    return parts.join('\n\n');
}

/**
 * Build the release body from a changelog and its candidate tag versions.
 *
 * - Finds the newest tag version that exists in the changelog (excluding the
 *   version being released) and combines every entry above it.
 * - Returns only the content inside `<!-- release:start -->` /
 *   `<!-- release:end -->` when those markers are present.
 * - Version headings are never included; entries are merged as if they were one
 *   version (equal `<details>` summary groups are concatenated).
 * - If there is no prior released version (first release), returns only the
 *   newest changelog entry instead of the entire file.
 * - Returns '' when the changelog has no version headings.
 */
export function buildReleaseNotes(
    changelog: string,
    tagVersions: string[],
    currentVersion?: string
): string {
    const entries = changelogEntries(changelog);
    if (entries.length === 0) return '';

    const versions = new Set(
        tagVersions
            .map(normalizeReleaseVersion)
            .filter((version): version is string => version !== undefined)
    );
    // Accept both `2.0.0` and `v2.0.0` as the version being released.
    const current = currentVersion
        ? (normalizeReleaseVersion(currentVersion) ?? currentVersion)
        : undefined;
    const previous = entries.find(
        entry => entry.version !== current && versions.has(entry.version)
    );
    // When the version being released is not a heading yet, the newest tagged
    // heading is not "previous": include the newest entry instead of returning
    // an empty body.
    const currentIsHeading = entries.some(entry => entry.version === current);
    const selected =
        previous && (currentIsHeading || previous !== entries[0])
            ? entries.slice(0, entries.indexOf(previous))
            : entries.slice(0, 1);
    const bodies = selected.map(entry => entryBody(changelog, entry)).filter(Boolean);
    return mergeBodies(bodies);
}

/** Read the release body from the repo's changelog + tags (with a first-release guard). */
export function releaseNotesFromGit(currentVersion: string, cwd = repoRoot()): string {
    const file = resolve(cwd, 'CHANGELOG.md');
    let changelog = '';
    if (existsSync(file)) {
        try {
            changelog = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
        } catch {
            changelog = '';
        }
    }
    const tags = spawnSync('git', ['tag', '--merged', 'HEAD', '--sort=-v:refname'], {
        cwd,
        encoding: 'utf8',
    });
    const tagVersions = (tags.stdout ?? '').split(/\r?\n/).filter(Boolean);
    const notes = buildReleaseNotes(changelog, tagVersions, currentVersion);
    return notes || `Release ${currentVersion}`;
}
