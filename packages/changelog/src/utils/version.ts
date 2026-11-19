import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { logger } from '@deltabox/toolchain/shared';

import type { BumpType } from '../types/index.js';
import {
    countCommitEntries,
    detailsEnabled,
    renderDetails,
    resolveDetails,
    type DetailsToggle,
} from './details.js';
import { discoverWorkspaceDirs, repoRoot } from './repo.js';

/** `June 2026` for a date. */
export function monthYear(date: Date): string {
    return `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
}

/** A full semver (optionally with a prerelease/build suffix). */
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** The configured prerelease identifier (eg. `beta`, `rc`), without a counter. */
const PRERELEASE_TAG = /^[0-9A-Za-z-]+$/;

/**
 * Apply a semver bump. With a `prerelease` tag the result becomes a prerelease:
 * a stable version bumps its core and starts at `<tag>.0`; an existing
 * prerelease keeps its core and continues the counter for the same tag (switching
 * tags starts that tag at `.0`). The suffix is never appended twice.
 */
export function bumpVersion(current: string, type: BumpType, prerelease?: string): string {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(current.trim());
    if (!match) throw new Error(`Cannot parse version "${current}"`);
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    const existing = match[4];
    const tag = prerelease?.trim();
    if (tag !== undefined && tag !== '' && !PRERELEASE_TAG.test(tag)) {
        throw new Error(
            `Invalid prerelease tag "${prerelease}" (use a single identifier like beta or rc).`
        );
    }

    if (tag) {
        if (existing !== undefined) {
            // Stay on the same core while a prerelease cycle is in progress.
            const sameTag = new RegExp(`^${tag}(?:\\.(\\d+))?$`).exec(existing);
            if (sameTag) {
                const counter = sameTag[1] ? Number(sameTag[1]) + 1 : 0;
                return `${major}.${minor}.${patch}-${tag}.${counter}`;
            }
            return `${major}.${minor}.${patch}-${tag}.0`;
        }
        const next = bumpedCore(major, minor, patch, type);
        return `${next}-${tag}.0`;
    }

    return bumpedCore(major, minor, patch, type);
}

/** Apply the numeric part of a semver bump. */
function bumpedCore(major: number, minor: number, patch: number, type: BumpType): string {
    if (type === 'major') return `${major + 1}.0.0`;
    if (type === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

/** Render a `## <version> (Month Year)` heading + summary, optionally marked. */
export function renderChangelogEntry(
    version: string,
    summary: string,
    date?: Date,
    withMarkers = true,
    packageChanges = '',
    intro = '',
    outro = '',
    details?: unknown,
    release = false
): string {
    const suffix = date ? ` (${monthYear(date)})` : '';
    const d = resolveDetails(details, release);
    const entryCount = countCommitEntries(summary);
    const wrap = (
        value: string,
        toggle: DetailsToggle,
        fallback: string,
        count = entryCount
    ): string => {
        if (!value.trim()) return '';
        return detailsEnabled(toggle, count)
            ? renderDetails(toggle.title ?? fallback, value, toggle.expanded === true)
            : value.trim();
    };
    const introBlock = wrap(intro, d.intro, 'Intro');
    const body = [
        summary.trim(),
        wrap(packageChanges, d.footer, 'Footer', countCommitEntries(packageChanges)),
        wrap(outro, d.outro, 'Outro'),
    ]
        .filter(Boolean)
        .join('\n\n');
    // `lifecycle: 'before'` renders sections before the body (via `buildSummary`)
    // but still needs the body/release-notes wrapper here.
    const bodyToggle = d.releaseNotes.enabled ? d.releaseNotes : d.body;
    const bodyBlock =
        d.lifecycle === 'before' && detailsEnabled(bodyToggle, entryCount)
            ? renderDetails(
                  bodyToggle.title ?? '**Release notes**',
                  body,
                  bodyToggle.expanded === true
              )
            : body;
    const introSection = introBlock ? `${introBlock}\n\n` : '';
    if (!withMarkers) {
        return `## ${version}${suffix}\n\n${introSection}${bodyBlock}`;
    }
    return `## ${version}${suffix}

${introSection}<!-- release:start -->

${bodyBlock}

<!-- release:end -->`;
}

/**
 * Insert the new entry directly after the `# Changelog` header, stripping the
 * `<!-- release:start/end -->` markers from every older entry first (only the
 * newest entry keeps them, for release tooling).
 */
export function insertNewEntry(existing: string, entry: string): string {
    const stripped = existing
        .split('\n')
        .filter(
            line =>
                !line.includes('<!-- release:start -->') && !line.includes('<!-- release:end -->')
        )
        .join('\n')
        .trimEnd();
    const normalized = stripped.replace(/\n{3,}/g, '\n\n');
    const lines = normalized.split('\n');
    const first = lines[0];
    let content: string;
    if (first !== undefined && first.startsWith('# ')) {
        content = [first, '', entry.trimEnd(), '', ...lines.slice(1)].join('\n');
    } else {
        content = `${entry.trimEnd()}\n\n${normalized}`;
    }
    return `${content.trimEnd()}\n`;
}

export function prependChangelogEntry(file: string, entry: string): void {
    const existing = existsSync(file) ? readFileSync(file, 'utf8') : '# Changelog\n';
    writeFileSync(file, insertNewEntry(existing, entry), 'utf8');
}

/** Rename the newest `## <current>` heading to `## <next>` in every changelog. */
export function retagChangelogs(current: string, next: string): void {
    const root = repoRoot();
    const files = [
        resolve(root, 'CHANGELOG.md'),
        ...discoverWorkspaceDirs().map(dir => resolve(dir, 'CHANGELOG.md')),
    ];
    for (const file of files) {
        if (!existsSync(file)) continue;
        const content = readFileSync(file, 'utf8');
        const updated = content
            .replace(`## ${current}`, `## ${next}`)
            .replace(`<h2>${current}`, `<h2>${next}`);
        if (updated !== content) {
            writeFileSync(file, updated, 'utf8');
            logger.info(`  retagged ${file}`);
        }
    }
}
