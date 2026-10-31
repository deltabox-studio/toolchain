import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type ChangelogBreakingSetting, logger } from '@deltabox/toolchain-shared';

import { isBreakingCommit } from './breaking.js';
import {
    capitalize,
    formatBody,
    formatLine,
    groupItems,
    parseCcSubject,
    renderGroups,
} from './format.js';
import { bulletHash, deriveVersionDate, readCommit, repoSlug } from './git.js';
import { packageChangesForVersion } from './packages.js';
import { changelogFiles, repoRoot } from './repo.js';
import type { ChangelogGroupsSetting, ExistingEntry, GroupedItem } from './types.js';
import { renderChangelogEntry } from './version.js';

/** Split a changelog into `## <version>` sections with their bullet lines. */
export function parseExistingChangelog(content: string): ExistingEntry[] {
    const entries: ExistingEntry[] = [];
    let current: ExistingEntry | undefined;
    for (const line of content.split('\n')) {
        const heading = /^##\s+([0-9]+\.[0-9]+\.[0-9]+)(?:\s*\(.*\))?\s*$/.exec(line);
        if (heading) {
            current = { version: heading[1]!, bullets: [] };
            entries.push(current);
            continue;
        }
        if (!current) continue;
        // Skip the release markers and every non-bullet (description) line: the
        // commit bodies are re-read from git, not reverse-engineered here.
        if (line.includes('<!-- release:')) continue;
        if (line.startsWith('- ')) current.bullets.push(line);
    }
    return entries;
}

/** The `([#hash](...) by <author>)(fixes ...)` credit suffix of a bullet. */
function creditSuffix(text: string): string {
    const idx = text.lastIndexOf('([#');
    if (idx === -1) return '';
    const tail = text.slice(idx);
    const match = /^(\(\[#[^\]]+\]\([^)]*\) by [^)]*\)\)?)(?:\(fixes [^)]*\)\)?)?/.exec(tail);
    return match?.[0] ?? '';
}

/** Regroup an existing (flat) entry's bullets into the grouped format. */
function reformatEntry(
    entry: ExistingEntry,
    repo: string | undefined,
    withMarkers = false,
    packageChanges = '',
    groups?: ChangelogGroupsSetting,
    breakingSetting?: ChangelogBreakingSetting
): string {
    const items: GroupedItem[] = [];
    for (const line of entry.bullets) {
        const stripped = line.replace(/^-\s+/, '');
        const hash = bulletHash(line);
        // Parse the ORIGINAL commit message when available: the changelog line
        // has bold/markdown applied that would otherwise corrupt CC parsing.
        const original = hash ? readCommit(hash) : undefined;
        const rawSubject = original?.subject ?? stripped.replace(/\*\*/g, '');
        const parsed = parseCcSubject(rawSubject);
        const suffix = creditSuffix(stripped);
        const subject = formatLine(capitalize(parsed.rest), repo);
        const text = `- ${[subject, suffix].filter(Boolean).join(' ')}`;
        const bodyParagraphs = original ? formatBody(original.body) : [];
        const breaking = isBreakingCommit(
            { subject: rawSubject, body: original?.body ?? '' },
            breakingSetting
        );
        items.push({ parsed, breaking, text, bodyParagraphs });
    }
    const date = deriveVersionDate(entry.version, entry.bullets);
    return renderChangelogEntry(
        entry.version,
        renderGroups(groupItems(items, groups)),
        date,
        withMarkers,
        packageChanges
    );
}

/** Backward-reformat an entire changelog file's content (all versions). */
export function reformatChangelogContent(
    content: string,
    repo: string | undefined,
    markersOnNewest = false,
    includePackageChanges = false,
    groups?: ChangelogGroupsSetting,
    breaking?: ChangelogBreakingSetting
): string {
    const entries = parseExistingChangelog(content);
    if (entries.length === 0) return content;
    const firstLine = content.split('\n')[0] ?? '# Changelog';
    const header = firstLine.startsWith('# ') ? firstLine : '# Changelog';
    const rendered = entries
        .map((entry, index) => {
            const previous = entries[index + 1];
            const changes =
                includePackageChanges && previous
                    ? packageChangesForVersion(entry.version, previous.version)
                    : '';
            return reformatEntry(
                entry,
                repo,
                markersOnNewest && index === 0,
                changes,
                groups,
                breaking
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
    breaking?: ChangelogBreakingSetting
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
        breaking
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
    breaking?: ChangelogBreakingSetting
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
            breaking
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
