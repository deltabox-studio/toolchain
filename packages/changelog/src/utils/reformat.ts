import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type ChangelogBreakingSetting, logger } from '@deltabox/toolchain/shared';

import type { ChangelogGroupsSetting, ExistingEntry, GroupedItem } from '../types/index.js';
import { isBreakingCommit } from './breaking.js';
import { applyDetailsToEntry, resolveDetails } from './details.js';
import {
    capitalize,
    formatBody,
    formatLine,
    groupItems,
    parseCcSubject,
    renderGroups,
} from './format.js';
import { bulletHash, deriveVersionDate, readCommit, repoSlug } from './git.js';
import {
    packageChangesForCurrent,
    packageChangesForVersion,
    resolveVersionRef,
} from './packages.js';
import { changelogFiles, repoRoot } from './repo.js';
import { renderChangelogEntry } from './version.js';

/** A version heading: `## 1.2.3`, `## [1.2.3]`, `## v1.2.3`, prereleases, dates. */
const VERSION_HEADING =
    /^##\s+\[?v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\]?\s*(?:\([^)]*\))?\s*(?:-\s+.*)?\s*$/;

/** A details-body version summary: `<summary><h2>1.2.3 (January 2026)</h2></summary>`. */
const VERSION_SUMMARY =
    /^<summary><h2>\[?v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\]?\s*(?:\([^)]*\))?\s*(?:-\s+.*)?<\/h2><\/summary>$/;

/** Whether the changelog has a `## ` section that is not a version heading. */
function hasUnsupportedHeading(content: string): boolean {
    for (const line of content.split('\n')) {
        if (/^##\s+/.test(line) && !VERSION_HEADING.test(line)) return true;
    }
    return false;
}

/**
 * Split a changelog into `## <version>` sections with their commit bullets and
 * nested description lines. The bodies are kept so a re-format can preserve a
 * hand-corrected description when the original commit body is unusable (eg. it
 * contains shell-escape artifacts).
 */
export function parseExistingChangelog(content: string): ExistingEntry[] {
    const entries: ExistingEntry[] = [];
    let current: ExistingEntry | undefined;
    // Dependency bullets under `### Package changes` are not commits; the footer
    // is regenerated from the package manifests, not re-parsed as changelog items.
    let inPackageChanges = false;
    let collectingBody = false;
    for (const line of content.split('\n')) {
        const heading = VERSION_SUMMARY.exec(line) ?? VERSION_HEADING.exec(line);
        if (heading) {
            current = { version: heading[1]!, bullets: [], bodies: [] };
            entries.push(current);
            inPackageChanges = false;
            collectingBody = false;
            continue;
        }
        if (/^##\s+/.test(line)) {
            // An unsupported section (`## Unreleased`, ...): do not fold its
            // bullets into the previous version entry.
            current = undefined;
            inPackageChanges = false;
            collectingBody = false;
            continue;
        }
        if (!current) continue;
        if (line.includes('<!-- release:')) continue;
        if (/^###\s+Package changes\s*$/.test(line)) {
            inPackageChanges = true;
            collectingBody = false;
            continue;
        }
        if (/^###\s+/.test(line)) {
            inPackageChanges = false;
            collectingBody = false;
            continue;
        }
        if (inPackageChanges) continue;
        if (/^[-*+]\s+/.test(line)) {
            current.bullets.push(line);
            current.bodies!.push([]);
            collectingBody = true;
            continue;
        }
        if (!line.trim()) {
            // A blank line may separate description paragraphs; keep collecting.
            continue;
        }
        if (collectingBody && line.startsWith('  ')) {
            current.bodies![current.bodies!.length - 1]!.push(line);
        }
    }
    return entries;
}

/** The `([#hash](...) by <author>)(fixes ...)` credit suffix of a bullet. */
function creditSuffix(text: string): string {
    const match =
        /\((?:\[#[0-9a-fA-F]{6,40}\]\([^)]*\)|#[0-9a-fA-F]{7,40}) by [^)]*\)(?:\(fixes [^)]*\))?\s*$/.exec(
            text
        );
    return match?.[0].trimEnd() ?? '';
}

/** Convert an entry's nested description lines into unwrapped paragraphs. */
function parseExistingBody(lines: string[]): string[][] {
    const paragraphs: string[][] = [];
    let current: string[] = [];
    for (const line of lines) {
        if (line.startsWith('  - ')) {
            if (current.length > 0) paragraphs.push([current.join(' ')]);
            current = [line.slice(4).trim()];
        } else if (line.startsWith('    ')) {
            current.push(line.slice(4).trim());
        } else if (line.startsWith('  ')) {
            // Legacy two-space continuation lines.
            current.push(line.slice(2).trim());
        }
    }
    if (current.length > 0) paragraphs.push([current.join(' ')]);
    return paragraphs;
}

/** Regroup an existing (flat) entry's bullets into the grouped format. */
function reformatEntry(
    entry: ExistingEntry,
    repo: string | undefined,
    withMarkers = false,
    packageChanges = '',
    groups?: ChangelogGroupsSetting,
    breakingSetting?: ChangelogBreakingSetting,
    detailsValue?: unknown,
    release = false
): string {
    const resolved = resolveDetails(detailsValue, release);
    const details = resolved.lifecycle === 'before' ? resolved : undefined;
    const items: GroupedItem[] = [];
    for (const [index, line] of entry.bullets.entries()) {
        const stripped = line.replace(/^[-*+]\s+/, '');
        const hash = bulletHash(line);
        // Parse the ORIGINAL commit message when available: the changelog line
        // has bold/markdown applied that would otherwise corrupt CC parsing.
        const original = hash ? readCommit(hash) : undefined;
        const suffix = creditSuffix(stripped);
        const withoutSuffix = suffix
            ? stripped.slice(0, stripped.length - suffix.length)
            : stripped;
        // The existing bullet is the source of truth for the displayed subject:
        // a hand-corrected description must survive `--format-only`. The
        // original commit is only used for grouping/breaking detection (and as
        // a fallback when the bullet has no subject of its own).
        const existing = parseCcSubject(withoutSuffix.replace(/\*\*/g, ''));
        const parsed = original ? parseCcSubject(original.subject) : existing;
        const subject = formatLine(capitalize(existing.rest.trim() || parsed.rest), repo);
        const text = `- ${[subject, suffix].filter(Boolean).join(' ')}`;
        // An existing description is never replaced: it may contain hand
        // corrections (eg. backticks the shell ate) that the git body cannot
        // reproduce. Only fill in a description when the entry has none.
        const body = entry.bodies?.[index] ?? [];
        const bodyParagraphs =
            body.length > 0 ? parseExistingBody(body) : original ? formatBody(original.body) : [];
        const breaking = isBreakingCommit(
            { subject: original?.subject ?? withoutSuffix, body: original?.body ?? '' },
            breakingSetting
        );
        items.push({ parsed, breaking, text, bodyParagraphs });
    }
    const date = deriveVersionDate(entry.version, entry.bullets);
    const rendered = renderChangelogEntry(
        entry.version,
        renderGroups(groupItems(items, groups), details),
        date,
        withMarkers,
        packageChanges
    );
    return resolved.lifecycle === 'after' ? applyDetailsToEntry(rendered, resolved) : rendered;
}

/** Backward-reformat an entire changelog file's content (all versions). */
export function reformatChangelogContent(
    content: string,
    repo: string | undefined,
    markersOnNewest = false,
    includePackageChanges = false,
    groups?: ChangelogGroupsSetting,
    breaking?: ChangelogBreakingSetting,
    details?: unknown,
    release = false
): string {
    // An unsupported `##` section (eg. `## Unreleased`) cannot be rendered by the
    // version-based reformatter; leave the file untouched instead of merging its
    // bullets into the previous release or dropping the section.
    if (hasUnsupportedHeading(content)) {
        logger.warn(
            'changelog: skipping reformat because the file has a non-version `##` heading.'
        );
        return content;
    }
    const entries = parseExistingChangelog(content);
    if (entries.length === 0) return content;
    const firstLine = content.split('\n')[0] ?? '# Changelog';
    const header = firstLine.startsWith('# ') ? firstLine : '# Changelog';
    const rendered = entries
        .map((entry, index) => {
            const previous = entries[index + 1];
            let changes = '';
            if (includePackageChanges && previous) {
                changes = packageChangesForVersion(entry.version, previous.version);
                // The newest entry is usually unreleased (no tag/version commit
                // yet), so its footer is the working tree against the previous
                // release, matching how `dbx changelog` generated it.
                if (index === 0 && !resolveVersionRef(entry.version)) {
                    changes = packageChangesForCurrent(previous.version);
                }
            }
            return reformatEntry(
                entry,
                repo,
                markersOnNewest && index === 0,
                changes,
                groups,
                breaking,
                details,
                release
            );
        })
        .filter(Boolean)
        .join('\n\n\n');
    return `${header}\n\n${rendered}\n`;
}

/** Backward-reformat the entire root changelog (all versions). */
export function reformatRootChangelog(
    includePackageChanges = false,
    groups?: ChangelogGroupsSetting,
    breaking?: ChangelogBreakingSetting,
    details?: unknown,
    release = false
): string {
    const root = repoRoot();
    const file = resolve(root, 'CHANGELOG.md');
    if (!existsSync(file)) return '';
    return reformatChangelogContent(
        readFileSync(file, 'utf8'),
        repoSlug(),
        false,
        includePackageChanges,
        groups,
        breaking,
        details,
        release
    );
}

/**
 * `--format-only`: regroup every existing changelog into the current format
 * (grouped rules/scopes, `(Month Year)` suffix, nested bullets) without bumping
 * a version or adding a new entry. Honours `--dry-run`.
 */
export function formatExistingChangelogs(
    dryRun: boolean,
    packageChanges = false,
    groups?: ChangelogGroupsSetting,
    breaking?: ChangelogBreakingSetting,
    details?: unknown,
    release = false
): void {
    const rootFile = resolve(repoRoot(), 'CHANGELOG.md');
    for (const file of changelogFiles()) {
        // Keep the release markers on the newest entry so release tooling still
        // works; older entries stay marker-free. The package-changes footer is
        // only added to the root changelog (it is repo-wide).
        const reformatted = reformatChangelogContent(
            readFileSync(file, 'utf8'),
            repoSlug(),
            true,
            packageChanges && file === rootFile,
            groups,
            breaking,
            details,
            release
        );
        if (dryRun) {
            const proposed = file.replace(/CHANGELOG\.md$/, 'CHANGELOG.proposed.md');
            writeFileSync(proposed, reformatted, 'utf8');
            logger.info(`[DRY-RUN] Wrote ${proposed}`);
        } else {
            writeFileSync(file, reformatted, 'utf8');
            logger.info(`  formatted ${file}`);
        }
    }
}
