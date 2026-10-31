#!/usr/bin/env node
/**
 * Scans pushed commits (via git), derives the semver bump, and applies it
 * directly: bumps the version in every workspace package.json and prepends the
 * new entry to the root + workspace CHANGELOG.md files (no changesets).
 *
 * Build:        yarn build:changelog  (tsc -> scripts/dist/changelog/index.js)
 * Usage:        node scripts/dist/changelog/index.js [options]
 *
 * Options:
 *   --range <range>            Git revision range or single rev to scan (default: HEAD).
 *   --processing-method <m>    How much of the changelog to process:
 *                                - `latest` — only the new (prepended) entry is
 *                                  generated with the grouped format (default).
 *                                - `all`     — backward-reformat the ENTIRE
 *                                  changelog so every version shares the same
 *                                  grouped format + `(Month Year)` suffix.
 *                                - <range>   — a git revision range; the new
 *                                  entry is generated from those commits (no
 *                                  backward reformatting).
 *                              Can also be set via `CHANGELOG_PROCESSING_METHOD`.
 *   --dry-run                  Print only the proposed new CHANGELOG.md entry (the
 *                              new version + its changes) without writing any
 *                              files, so you can verify how it will look before
 *                              running the real thing. Writes `CHANGELOG.proposed.md`.
 *   --format-only              Only regroup the existing CHANGELOG.md files
 *                              (root + workspaces) into the current format
 *                              (grouped rules/scopes, `(Month Year)` suffix,
 *                              nested bullets) — no version bump, no new entry.
 *                              Combines with `--dry-run` (writes
 *                              `CHANGELOG.proposed.md`).
 *   --version <semver>         Override the version (e.g. from a maintainer review):
 *                              bumps every workspace package.json to <semver> and
 *                              re-tags the newest CHANGELOG entry in each changelog.
 *   --base-version <semver>    Use <semver> as the starting point for the bump instead
 *                              of the local package.json version (e.g. the latest
 *                              released npm version when cutting a release branch from
 *                              dev, whose version lags behind).
 *
 * Each version heading carries a `(Month Year)` suffix. Commits are grouped by
 * Conventional-Commits rule (eg. `feat` -> "New features") and, within a rule,
 * by scope (eg. `server` -> "Server"). Commit bodies are rendered as nested
 * indented text, with conventional footers (eg. `BREAKING CHANGE:`) extracted
 * and listed, so a commit's details are never crammed onto a single line.
 *
 * Each changelog line is suffixed with the commit's short id and a credit for
 * the commit author (username only, never the email) linked to their GitHub
 * profile, both resolved via `gh` (falling back to the noreply email username,
 * then the plain name when unavailable). When a commit belongs to a pull
 * request, the PR author is credited instead of each individual author.
 * Commits referencing issues with a closing keyword (fixes/closes/resolves)
 * also get a "(fixes [#N <title>](<url>))" suffix.
 *
 * The rendered entry is wrapped in <!-- release:start --> / <!-- release:end -->
 * markers so release tooling can extract only the newest entry's changes.
 *
 * The pipeline is split across sibling modules:
 *   - `args.ts`     CLI parsing            - `git.ts`     git/gh helpers
 *   - `format.ts`   CC parsing/rendering   - `repo.ts`    workspace/fs helpers
 *   - `version.ts`  bump + entry rendering - `summary.ts` grouped summary
 *   - `reformat.ts` backward reformatting  - `write.ts`   changelog writing
 *
 * Examples:
 *   node scripts/dist/changelog/index.js --dry-run --range "HEAD~3..HEAD"
 *   node scripts/dist/changelog/index.js --processing-method all --dry-run
 *   CHANGELOG_PROCESSING_METHOD=all node scripts/dist/changelog/index.js
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type ChangelogConfig, logger, resolveCommitlintEnabled } from '@deltabox/toolchain-shared';

import { parseArgsCli } from './utils/args.js';
import { readCommits } from './utils/git.js';
import { packageChangesForCurrent } from './utils/packages.js';
import {
    formatExistingChangelogs,
    parseExistingChangelog,
    reformatRootChangelog,
} from './utils/reformat.js';
import { changelogFiles, readRootVersion, repoRoot, writeVersion } from './utils/repo.js';
import { buildSummary } from './utils/summary.js';
import type {
    ChangelogGroupsSetting,
    ChangelogProvider,
    CommitFormatOptions,
} from './utils/types.js';
import { insertNewEntry, renderChangelogEntry, retagChangelogs } from './utils/version.js';
import {
    deriveCustomBump,
    planVersions,
    resolveVersioning,
    writePackageVersion,
} from './utils/versioning.js';
import { writeChangelogs } from './utils/write.js';

/**
 * Run the changelog pipeline (bump versions + write changelogs). `changelog` is
 * the consumer's `toolchain.ci.changelog` config (threaded from `dbx changelog`);
 * the standalone bin runs with the defaults (`versioning: true`, uniform).
 */
export function runChangelog(
    argv: string[] = process.argv.slice(2),
    changelog?: ChangelogConfig
): void {
    const options = parseArgsCli(argv);
    const groups = changelog?.groups as ChangelogGroupsSetting | undefined;

    // `--format-only` just regroups the existing changelog files (no bump, no
    // new entry); `--range`/`--dry-run` still apply.
    if (options.formatOnly) {
        logger.info(
            `[format-only] Reformatting ${changelogFiles().length} changelog file(s)${
                options.dryRun ? ' (dry run)' : ''
            }.`
        );
        formatExistingChangelogs(options.dryRun, options.packageChanges, groups);
        return;
    }

    const localCurrent = readRootVersion();

    // Version override (e.g. a maintainer requested a different version).
    if (options.version) {
        const next = options.version.trim();
        if (!/^\d+\.\d+\.\d+$/.test(next)) throw new Error(`Invalid version: ${next}`);
        if (next === localCurrent) {
            logger.info(`Version is already ${next}; nothing to do.`);
            return;
        }
        writeVersion(next);
        retagChangelogs(localCurrent, next);
        logger.info(`Retagged versions ${localCurrent} -> ${next}.`);
        return;
    }

    // The bump starts from --base-version when provided (e.g. the latest npm
    // version), otherwise from the local package.json version.
    let current = localCurrent;
    if (options.baseVersion) {
        if (!/^\d+\.\d+\.\d+$/.test(options.baseVersion.trim())) {
            throw new Error(`Invalid base version: ${options.baseVersion}`);
        }
        current = options.baseVersion.trim();
    }

    // `latest` (default) and `<range>` only generate the new entry; `all` also
    // backward-reformats the entire changelog. A `<range>` value overrides the
    // commit source range.
    const method = options.processingMethod;
    const reformatAll = method === 'all';
    const range = method !== 'latest' && method !== 'all' ? method : options.range;

    const records = readCommits(range);
    const versioning = resolveVersioning(changelog);
    const provider = versioning.provider as ChangelogProvider | string | undefined;
    if (!options.dryRun && provider === 'changesets') {
        const result = spawnSync('npx', ['--yes', 'changeset', 'version'], {
            cwd: repoRoot(),
            stdio: 'inherit',
            // `npx` is a `.cmd` shim on Windows, which spawn cannot execute
            // directly without a shell.
            shell: process.platform === 'win32',
        });
        if (result.status !== 0) throw new Error('changesets provider failed.');
        logger.info('Ran the changesets provider; changesets owns the changelog/version output.');
        return;
    }
    const type = deriveCustomBump(records, versioning.bump, versioning.allowOverBump);
    const commitlint = resolveCommitlintEnabled(changelog);
    let summary = buildSummary(records, {
        commitlint,
        range,
        ...(groups ? { groups } : {}),
        ...(versioning.commit ? { commit: versioning.commit as CommitFormatOptions } : {}),
    });
    if (provider && typeof provider === 'object' && typeof provider.run === 'function') {
        const custom = provider.run({ cwd: repoRoot(), changelog, records });
        if (typeof custom === 'string') summary = custom;
    } else if (typeof provider === 'function') {
        const custom = (
            provider as (ctx: {
                cwd: string;
                changelog?: ChangelogConfig;
                records: typeof records;
            }) => string | void
        )({ cwd: repoRoot(), changelog, records });
        if (typeof custom === 'string') summary = custom;
    }

    const plan = planVersions({
        versioning,
        rootVersion: current,
        bump: type,
        range,
        ...(versioning.bump ? { bumpRules: versioning.bump } : {}),
        ...(versioning.allowOverBump ? { allowOverBump: true } : {}),
    });
    const next = plan.rootVersion;

    if (options.dryRun) {
        const root = repoRoot();
        const existingFile = resolve(root, 'CHANGELOG.md');
        const existing = existsSync(existingFile) ? readFileSync(existingFile, 'utf8') : '';
        const previousVersion = parseExistingChangelog(existing)[0]?.version;
        const footer =
            options.packageChanges && previousVersion
                ? packageChangesForCurrent(previousVersion)
                : '';
        const entry = renderChangelogEntry(next, summary, new Date(), true, footer);
        logger.info(`[DRY-RUN] Range: ${range}`);
        logger.info(
            `[DRY-RUN] Processing method: ${method}${reformatAll ? ' (backward reformat)' : ''}`
        );
        logger.info(`[DRY-RUN] Bump: ${type} (\`${current}\` -> \`${next}\`)`);
        logger.info(`[DRY-RUN] Versioning: ${versioning.enabled ? versioning.target : 'disabled'}`);
        logger.info(`[DRY-RUN] ${records.length} commit(s) scanned. Project files untouched.`);
        logger.info('');
        logger.info('Proposed new CHANGELOG.md entry (new version only):');
        logger.info('');
        logger.raw(entry);
        logger.info('--- end of proposed entry ---');
        // Write the full proposed root CHANGELOG.md (existing content + new
        // entry, or the fully reformatted changelog for `all`) to
        // CHANGELOG.proposed.md, with the new entry inserted at the top.
        const base = reformatAll ? reformatRootChangelog(options.packageChanges, groups) : existing;
        const content = insertNewEntry(base, entry);
        const proposed = resolve(root, 'CHANGELOG.proposed.md');
        writeFileSync(proposed, content, 'utf8');
        logger.info(`Wrote ${proposed}`);
        return;
    }

    for (const [dir, version] of plan.writes) writePackageVersion(dir, version);
    writeChangelogs(
        next,
        range,
        records,
        summary,
        reformatAll,
        options.packageChanges,
        plan.entries,
        commitlint,
        groups
    );
    if (versioning.enabled) {
        logger.info(`Bumped ${current} -> ${next} (${type}) from ${records.length} commit(s).`);
    } else {
        logger.info(
            `Wrote changelogs for ${next} (${type}) from ${records.length} commit(s); versioning disabled.`
        );
    }
}

// Exported so tests can dry-run the pipeline (grouping/rendering) directly.
export { parseArgsCli } from './utils/args.js';
export {
    formatBody,
    groupItems,
    parseCcSubject,
    renderGroups,
    ruleTitle,
    splitInlineDescription,
} from './utils/format.js';
export { deriveBump, readCommits } from './utils/git.js';
export { parseExistingChangelog, reformatChangelogContent } from './utils/reformat.js';
export { buildSummary } from './utils/summary.js';
export { renderChangelogEntry } from './utils/version.js';

/** Alias kept for backwards compatibility. */
export const main = runChangelog;

// Run only when executed directly (not when imported by tests/tooling, and not
// when this module is inlined into a single-file bundle where `import.meta.url`
// resolves to the bundle rather than to this file).
const modulePath = fileURLToPath(import.meta.url);
if (
    process.argv[1] &&
    /[\\/]run\.[cm]?[jt]s$/.test(modulePath) &&
    safeRealpath(process.argv[1]) === modulePath
) {
    runChangelog();
}

function safeRealpath(file: string): string {
    try {
        return realpathSync(file);
    } catch {
        return file;
    }
}
