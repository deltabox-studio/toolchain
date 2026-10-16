import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { logger } from '@deltabox/toolchain-shared';

import { formatChangelogFile } from './format.js';
import { readCommits, repoSlug } from './git.js';
import { packageChangesForCurrent } from './packages.js';
import { parseExistingChangelog, reformatRootChangelog } from './reformat.js';
import { discoverWorkspaceDirs, repoRoot } from './repo.js';
import { buildSummary } from './summary.js';
import type { CommitRecord } from './types.js';
import { prependChangelogEntry, renderChangelogEntry } from './version.js';

/** Prepend the new entry to the root + workspace changelogs and normalize links. */
export function writeChangelogs(
    version: string,
    range: string,
    records: CommitRecord[],
    summary: string,
    reformatAll: boolean,
    packageChanges = false
): void {
    const root = repoRoot();
    const repo = repoSlug();
    const rootChangelog = resolve(root, 'CHANGELOG.md');

    // The package-changes footer compares the working tree against the newest
    // released version already in the changelog (skipped when unchanged).
    let footer = '';
    if (packageChanges && existsSync(rootChangelog)) {
        const previous = parseExistingChangelog(readFileSync(rootChangelog, 'utf8'))[0];
        if (previous) footer = packageChangesForCurrent(previous.version);
    }

    if (reformatAll) {
        // Rewrite the whole root changelog cohesively, then prepend the new entry.
        const reformatted = reformatRootChangelog(packageChanges);
        if (reformatted) {
            writeFileSync(rootChangelog, reformatted, 'utf8');
            logger.info(`  reformatted ${rootChangelog}`);
        }
    }

    // The root changelog lists every pushed commit.
    const entry = renderChangelogEntry(version, summary, new Date(), true, footer);
    prependChangelogEntry(rootChangelog, entry);
    logger.info(`  updated ${rootChangelog}`);

    // Each workspace changelog only lists commits touching that workspace dir.
    for (const dir of discoverWorkspaceDirs()) {
        if (resolve(dir) === resolve(root)) continue;
        const file = resolve(dir, 'CHANGELOG.md');
        if (!existsSync(file)) continue;
        const rel = relative(root, dir).replace(/\\/g, '/');
        const filtered = readCommits(range, rel);
        if (filtered.length === 0) {
            logger.info(`  skipped ${file} (no commits in ${rel})`);
            continue;
        }
        const wsSummary = buildSummary(filtered);
        prependChangelogEntry(file, renderChangelogEntry(version, wsSummary, new Date()));
        logger.info(`  updated ${file}`);
    }
    // Normalize every changelog (all versions, including old entries).
    for (const file of [
        resolve(root, 'CHANGELOG.md'),
        ...discoverWorkspaceDirs()
            .filter(dir => resolve(dir) !== resolve(root))
            .map(dir => resolve(dir, 'CHANGELOG.md'))
            .filter(file => existsSync(file)),
    ]) {
        formatChangelogFile(file, repo);
    }
}
