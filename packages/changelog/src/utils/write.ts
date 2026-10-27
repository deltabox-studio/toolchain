import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { logger } from '@deltabox/toolchain-shared';

import { formatChangelogFile } from './format.js';
import { readCommits, repoSlug } from './git.js';
import { relatedWorkspacePaths } from './graph.js';
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
    workspaceEntries?: Map<string, string>,
    commitlint = true
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

    // Each versioned workspace gets its own changelog, listing only its related
    // commits: those touching the workspace dir **or any workspace it depends
    // on** (resolved from the project graph). The file is created when missing.
    const entries =
        workspaceEntries ??
        new Map<string, string>(
            discoverWorkspaceDirs()
                .filter(dir => resolve(dir) !== resolve(root))
                .map(dir => [dir, version] as [string, string])
        );
    for (const [dir, workspaceVersion] of entries) {
        const file = resolve(dir, 'CHANGELOG.md');
        const filtered = readCommits(range, relatedWorkspacePaths(dir, root));
        if (filtered.length === 0) {
            logger.info(`  skipped ${file} (no related commits)`);
            continue;
        }
        const created = !existsSync(file);
        const wsSummary = buildSummary(filtered, { commitlint, range });
        prependChangelogEntry(file, renderChangelogEntry(workspaceVersion, wsSummary, new Date()));
        logger.info(`  ${created ? 'created' : 'updated'} ${file}`);
    }
    // Normalize every changelog (all versions, including old entries).
    const dirs = new Set<string>([...discoverWorkspaceDirs(), ...entries.keys()]);
    for (const dir of dirs) {
        const file = resolve(dir, 'CHANGELOG.md');
        if (existsSync(file)) formatChangelogFile(file, repo);
    }
}
