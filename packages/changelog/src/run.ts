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
 *   --range <range>            Git revision range or single rev to scan (default:
 *                              the commits since the last release boundary).
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
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    type ChangelogBreakingSetting,
    type ChangelogConfig,
    logger,
    resolveCommitlintEnabled,
} from '@deltabox/toolchain/shared';

import type {
    ChangelogGroupsSetting,
    ChangelogProviderSetting,
    CommitFormatOptions,
} from './types/index.js';
import { parseArgsCli } from './utils/args.js';
import { applyDetailsToEntry, resolveDetails } from './utils/details.js';
import { isGitRepository, isReleaseCommit, lastReleaseRef, readCommits } from './utils/git.js';
import { packageChangesForCurrent } from './utils/packages.js';
import {
    formatExistingChangelogs,
    parseExistingChangelog,
    reformatRootChangelog,
} from './utils/reformat.js';
import { releaseNotesFromGit } from './utils/release-notes.js';
import {
    changelogFiles,
    isCommitReleased,
    readReleasedHashes,
    readRootVersion,
    repoRoot,
    writeVersion,
} from './utils/repo.js';
import { buildSummary } from './utils/summary.js';
import { resolveScopedOption, resolveTextSetting } from './utils/target.js';
import {
    insertNewEntry,
    renderChangelogEntry,
    retagChangelogs,
    SEMVER_PATTERN,
} from './utils/version.js';
import {
    bumpRulesFor,
    deriveCustomBump,
    overBumpFor,
    planVersions,
    resolveVersioning,
    writePackageVersion,
} from './utils/versioning.js';
import { writeChangelogs } from './utils/write.js';

/** Whether semver `a` is newer than `b` (prereleases sort before releases). */
function semverGreater(a: string, b: string): boolean {
    const split = (value: string): [number[], string | undefined] => {
        const [core, prerelease] = value.split('-', 2);
        return [core!.split('.').map(part => Number.parseInt(part, 10) || 0), prerelease];
    };
    const [aCore, aPre] = split(a);
    const [bCore, bPre] = split(b);
    for (let index = 0; index < 3; index += 1) {
        const difference = (aCore[index] ?? 0) - (bCore[index] ?? 0);
        if (difference !== 0) return difference > 0;
    }
    // A release is newer than its own prerelease.
    return aPre === undefined && bPre !== undefined;
}

/** Every commit hash already referenced by a root + workspace changelog. */
function releasedCommitHashes(): Set<string> {
    const hashes = new Set<string>();
    for (const file of changelogFiles()) {
        for (const hash of readReleasedHashes(file)) hashes.add(hash);
    }
    return hashes;
}

/** The `versioning.commit.details` value from a changelog config. */
function detailsOf(changelog?: ChangelogConfig): unknown {
    const versioning = changelog?.versioning;
    if (!versioning || typeof versioning !== 'object') return undefined;
    const commit = (versioning as { commit?: { details?: unknown } }).commit;
    return commit?.details;
}

/** Append a CLI-provided intro/outro entry to the config setting. */
function appendTextEntry<T>(setting: T | T[] | undefined, entry: T): T | T[] {
    if (setting === undefined) return entry;
    return [...(Array.isArray(setting) ? setting : [setting]), entry];
}

export interface RunChangelogOptions {
    /** Top-level `toolchain.enabled` (default true). */
    enabled?: boolean;
    /** `ci.regenerate` / `ci.changelog.regenerate` (default true). */
    regenerate?: boolean;
}

/**
 * Run the changelog pipeline (bump versions + write changelogs). `changelog` is
 * the consumer's `toolchain.ci.changelog` config (threaded from `dbx changelog`);
 * the standalone bin runs with the defaults (`versioning: true`, uniform).
 */
export function runChangelog(
    argv: string[] = process.argv.slice(2),
    changelog?: ChangelogConfig,
    runOptions: RunChangelogOptions = {}
): void {
    const options = parseArgsCli(argv);
    // Machine-readable release body (used by the generated release workflow).
    // It is derived from git alone and needs no toolchain config, so it must
    // run before the `enabled` guard: printing a decorated info line to stdout
    // would corrupt the release body.
    if (options.releaseNotes) {
        if (!isGitRepository()) throw new Error('dbx changelog: not a git repository.');
        logger.raw(releaseNotesFromGit(options.releaseNotes));
        return;
    }
    if (runOptions.enabled === false) {
        logger.info('toolchain disabled; skipping changelog.');
        return;
    }
    if (runOptions.regenerate === false) {
        logger.info('changelog regeneration disabled; skipping writes.');
        return;
    }
    const groups = changelog?.groups as ChangelogGroupsSetting | undefined;
    const breaking = changelog?.breaking as ChangelogBreakingSetting | undefined;

    // `--format-only` just regroups the existing changelog files (no bump, no
    // new entry); `--range`/`--dry-run` still apply.
    if (options.formatOnly) {
        logger.info(
            `[format-only] Reformatting ${changelogFiles().length} changelog file(s)${
                options.dryRun ? ' (dry run)' : ''
            }.`
        );
        formatExistingChangelogs(
            options.dryRun,
            options.packageChanges,
            groups,
            breaking,
            detailsOf(changelog),
            options.release
        );
        return;
    }

    // Version override (e.g. a maintainer requested a different version). It
    // only rewrites package versions/changelog headings, so git is not needed.
    if (options.version) {
        const localCurrent = readRootVersion();
        const next = options.version.trim();
        if (!SEMVER_PATTERN.test(next)) throw new Error(`Invalid version: ${next}`);
        if (next === localCurrent) {
            logger.info(`Version is already ${next}; nothing to do.`);
            return;
        }
        if (options.dryRun) {
            logger.info(`[DRY-RUN] Would retag versions ${localCurrent} -> ${next}.`);
            return;
        }
        writeVersion(next);
        retagChangelogs(localCurrent, next);
        logger.info(`Retagged versions ${localCurrent} -> ${next}.`);
        return;
    }

    // The bump starts from --base-version when provided (e.g. the latest npm
    // version), otherwise from the local package.json version.
    if (!isGitRepository()) throw new Error('dbx changelog: not a git repository.');
    const versioning = resolveVersioning(changelog);
    const localCurrent = readRootVersion();
    let current = localCurrent;
    if (options.baseVersion) {
        if (!SEMVER_PATTERN.test(options.baseVersion.trim())) {
            throw new Error(`Invalid base version: ${options.baseVersion}`);
        }
        current = options.baseVersion.trim();
    }
    // With versioning disabled package.json never advances, so seed the bump
    // from the newest existing heading instead: otherwise every run re-bumps
    // from the same version and headings go backwards.
    if (!versioning.enabled && !options.baseVersion) {
        const file = resolve(repoRoot(), 'CHANGELOG.md');
        if (existsSync(file)) {
            const newest = parseExistingChangelog(readFileSync(file, 'utf8'))[0]?.version;
            if (newest && SEMVER_PATTERN.test(newest) && semverGreater(newest, current)) {
                current = newest;
            }
        }
    }

    // `latest` (default) and `<range>` only generate the new entry; `all` also
    // backward-reformats the entire changelog. A `<range>` value overrides the
    // commit source range.
    const method = options.processingMethod;
    const reformatAll = method === 'all';
    let range = method !== 'latest' && method !== 'all' ? method : options.range;
    // With no explicit range, stop at the last release boundary so a second run
    // cannot re-bump (and re-list) commits that were already released.
    if (method === 'latest' && !options.rangeExplicit) {
        const boundary = lastReleaseRef();
        if (boundary) range = `${boundary}..HEAD`;
    }

    const rootDir = repoRoot();
    const provider = resolveScopedOption<ChangelogProviderSetting | undefined>(
        versioning.provider as never,
        rootDir,
        rootDir
    );
    const rootCommit = resolveScopedOption<CommitFormatOptions | undefined>(
        versioning.commit as never,
        rootDir,
        rootDir
    );
    const rootBumpRules = bumpRulesFor(versioning.bump, rootDir, rootDir);
    const rootOverBump = overBumpFor(versioning, rootDir, rootDir);
    const cliIntro = options.intro
        ? { content: options.intro }
        : options.introFile
          ? { file: resolve(options.introFile) }
          : undefined;
    const cliOutro = options.outro
        ? { content: options.outro }
        : options.outroFile
          ? { file: resolve(options.outroFile) }
          : undefined;
    const introSetting = cliIntro
        ? appendTextEntry(
              changelog?.intro as { content?: string; file?: string } | undefined,
              cliIntro
          )
        : changelog?.intro;
    const outroSetting = cliOutro
        ? appendTextEntry(
              changelog?.outro as { content?: string; file?: string } | undefined,
              cliOutro
          )
        : changelog?.outro;
    const introFor = (dir: string): string | undefined =>
        resolveTextSetting(introSetting, dir, rootDir, rootDir);
    const outroFor = (dir: string): string | undefined =>
        resolveTextSetting(outroSetting, dir, rootDir, rootDir);
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

    const released = releasedCommitHashes();
    let records = readCommits(range).filter(record => !isReleaseCommit(record.subject));
    if (released.size > 0) {
        records = records.filter(record => !isCommitReleased(record.hash, released));
    }
    if (records.length === 0) {
        logger.info('No new commits since the last release; nothing to do.');
        return;
    }
    const type = deriveCustomBump(records, rootBumpRules, rootOverBump, {
        env: process.env,
        logger,
        ...(breaking !== undefined ? { breaking } : {}),
    });
    const commitlint = resolveCommitlintEnabled(changelog);
    let summary = buildSummary(records, {
        commitlint,
        range,
        ...(groups ? { groups } : {}),
        ...(breaking !== undefined ? { breaking } : {}),
        ...(rootCommit ? { commit: rootCommit } : {}),
        release: options.release,
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
        ...(rootBumpRules ? { bumpRules: rootBumpRules } : {}),
        ...(rootOverBump ? { allowOverBump: true } : {}),
        ...(breaking !== undefined ? { breaking } : {}),
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
        const rootDetails = resolveDetails(rootCommit?.details, options.release);
        const entry =
            rootDetails.lifecycle === 'after'
                ? applyDetailsToEntry(
                      renderChangelogEntry(
                          next,
                          summary,
                          new Date(),
                          true,
                          footer,
                          introFor(root) ?? '',
                          outroFor(root) ?? '',
                          rootCommit?.details,
                          options.release
                      ),
                      rootDetails
                  )
                : renderChangelogEntry(
                      next,
                      summary,
                      new Date(),
                      true,
                      footer,
                      introFor(root) ?? '',
                      outroFor(root) ?? '',
                      rootCommit?.details,
                      options.release
                  );
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
        const base = reformatAll
            ? reformatRootChangelog(
                  options.packageChanges,
                  groups,
                  breaking,
                  detailsOf(changelog),
                  options.release
              )
            : existing;
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
        groups,
        breaking,
        {
            intro: introFor,
            outro: outroFor,
            commit: dir =>
                resolveScopedOption<CommitFormatOptions | undefined>(
                    versioning.commit as never,
                    dir,
                    rootDir
                ),
            provider: dir =>
                resolveScopedOption<ChangelogProviderSetting | undefined>(
                    versioning.provider as never,
                    dir,
                    rootDir
                ),
            release: options.release,
        },
        changelog
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
export { isBreakingCommit } from './utils/breaking.js';
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
