import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { repoRoot } from './repo.js';

interface VersionHeading {
    version: string;
    index: number;
}

/** Normalize a tag to its semver version (`v1.2.3`, `@scope/pkg@1.2.3` -> `1.2.3`). */
export function normalizeReleaseVersion(tag: string): string | undefined {
    const match = /(?:^|@)v?(\d+\.\d+\.\d+)$/.exec(tag.trim());
    return match?.[1];
}

function versionHeadings(changelog: string): VersionHeading[] {
    const headings: VersionHeading[] = [];
    const pattern = /^##\s+(\d+\.\d+\.\d+)(?:\s|$)/gm;
    for (const match of changelog.matchAll(pattern)) {
        if (match.index === undefined) continue;
        headings.push({ version: match[1]!, index: match.index });
    }
    return headings;
}

/**
 * Build the release body from a changelog and its candidate tag versions.
 *
 * - Finds the newest tag version that exists in the changelog (excluding the
 *   version being released) and returns everything above it.
 * - If there is no prior released version (first release), returns only the
 *   newest changelog entry instead of the entire file.
 * - Returns '' when the changelog has no version headings.
 */
export function buildReleaseNotes(
    changelog: string,
    tagVersions: string[],
    currentVersion?: string
): string {
    const headings = versionHeadings(changelog);
    if (headings.length === 0) return '';
    const start = headings[0]!.index;

    const versions = new Set(
        tagVersions
            .map(normalizeReleaseVersion)
            .filter((version): version is string => version !== undefined)
    );
    // Accept both `2.0.0` and `v2.0.0` as the version being released.
    const current = currentVersion
        ? (normalizeReleaseVersion(currentVersion) ?? currentVersion)
        : undefined;
    const previous = headings.find(
        heading => heading.version !== current && versions.has(heading.version)
    );
    const end = previous ? previous.index : (headings[1]?.index ?? changelog.length);
    if (end <= start) return '';
    return changelog.slice(start, end).trimEnd();
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
