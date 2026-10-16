import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { logger } from '@deltabox/toolchain-shared';

import { discoverWorkspaceDirs, repoRoot } from './repo.js';
import type { BumpType } from './types.js';

/** `June 2026` for a date. */
export function monthYear(date: Date): string {
    return `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
}

/** Apply a semver bump to a `major.minor.patch` string. */
export function bumpVersion(current: string, type: BumpType): string {
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(current);
    if (!match) throw new Error(`Cannot parse version "${current}"`);
    let major = Number(match[1]);
    let minor = Number(match[2]);
    let patch = Number(match[3]);
    if (type === 'major') {
        major += 1;
        minor = 0;
        patch = 0;
    } else if (type === 'minor') {
        minor += 1;
        patch = 0;
    } else {
        patch += 1;
    }
    return `${major}.${minor}.${patch}`;
}

/** Render a `## <version> (Month Year)` heading + summary, optionally marked. */
export function renderChangelogEntry(
    version: string,
    summary: string,
    date?: Date,
    withMarkers = true,
    packageChanges = ''
): string {
    const suffix = date ? ` (${monthYear(date)})` : '';
    const body = packageChanges ? `${summary}\n\n${packageChanges}` : summary;
    if (!withMarkers) {
        return `## ${version}${suffix}\n\n${body}`;
    }
    return `## ${version}${suffix}

<!-- release:start -->

${body}

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
        const updated = content.replace(`## ${current}`, `## ${next}`);
        if (updated !== content) {
            writeFileSync(file, updated, 'utf8');
            logger.info(`  retagged ${file}`);
        }
    }
}
