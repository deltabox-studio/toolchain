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
    packageChanges = false,
    workspaceEntries?: Map<string, string>
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

    // Each versioned workspace changelog only lists commits touching that
    // workspace dir, headed by the version the versioning plan assigned it.
    const entries =
        workspaceEntries ??
        new Map<string, string>(
            discoverWorkspaceDirs()
                .filter(dir => resolve(dir) !== resolve(root))
                .map(dir => [dir, version] as [string, string])
        );
    for (const [dir, workspaceVersion] of entries) {
        const file = resolve(dir, 'CHANGELOG.md');
        if (!existsSync(file)) continue;
        const rel = relative(root, dir).replace(/\\/g, '/');
        const filtered = readCommits(range, rel);
        if (filtered.length === 0) {
            logger.info(`  skipped ${file} (no commits in ${rel})`);
            continue;
        }
        const wsSummary = buildSummary(filtered);
        prependChangelogEntry(file, renderChangelogEntry(workspaceVersion, wsSummary, new Date()));
        logger.info(`  updated ${file}`);
    }
    // Normalize every changelog (all versions, including old entries).
    const dirs = new Set<string>([...discoverWorkspaceDirs(), ...entries.keys()]);
    for (const dir of dirs) {
        const file = resolve(dir, 'CHANGELOG.md');
        if (existsSync(file)) formatChangelogFile(file, repo);
    }
}
