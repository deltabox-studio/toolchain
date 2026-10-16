/**
 * Best-effort "a newer version is published" check.
 *
 * Runs in the background (never blocks the command), caches the registry answer
 * for a day, and prints a short notice with a link to the release when a newer
 * `@deltabox/toolchain` exists. It is disabled in CI, by `NO_UPDATE_NOTIFIER` /
 * `DBX_NO_UPDATE_CHECK`, and by the `--no-update-check` flag.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { logger } from '@deltabox/toolchain-shared';

/** The published package whose latest version is checked. */
export const UPDATE_PACKAGE = '@deltabox/toolchain';

const REGISTRY_URL = `https://registry.npmjs.org/${UPDATE_PACKAGE}/latest`;
const RELEASE_URL = 'https://github.com/deltabox-studio/toolchain/releases/tag';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 1500;

interface UpdateCache {
    checkedAt: number;
    latest: string;
}

function cacheFile(): string {
    return path.join(os.tmpdir(), 'dbx-update-check.json');
}

function readCache(): UpdateCache | undefined {
    try {
        return JSON.parse(fs.readFileSync(cacheFile(), 'utf-8')) as UpdateCache;
    } catch {
        return undefined;
    }
}

function writeCache(cache: UpdateCache): void {
    try {
        fs.writeFileSync(cacheFile(), JSON.stringify(cache), 'utf-8');
    } catch {
        // Caching is best-effort.
    }
}

/** Whether `candidate` is a strictly newer `major.minor.patch` than `current`. */
export function isNewer(candidate: string, current: string): boolean {
    const a = candidate.split('.').map(part => Number.parseInt(part, 10) || 0);
    const b = current.split('.').map(part => Number.parseInt(part, 10) || 0);
    for (let index = 0; index < 3; index++) {
        const next = a[index] ?? 0;
        const mine = b[index] ?? 0;
        if (next !== mine) return next > mine;
    }
    return false;
}

async function fetchLatest(): Promise<string | undefined> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const response = await fetch(REGISTRY_URL, {
            signal: controller.signal,
            headers: { accept: 'application/json' },
        });
        clearTimeout(timer);
        if (!response.ok) return undefined;
        const data = (await response.json()) as { version?: string };
        return typeof data.version === 'string' ? data.version : undefined;
    } catch {
        return undefined;
    }
}

/** The newer version, when one exists (using and refreshing the daily cache). */
export async function checkForUpdate(current: string): Promise<string | undefined> {
    const cached = readCache();
    if (cached && Date.now() - cached.checkedAt < CHECK_INTERVAL_MS) {
        return isNewer(cached.latest, current) ? cached.latest : undefined;
    }
    const latest = await fetchLatest();
    if (latest) writeCache({ checkedAt: Date.now(), latest });
    return latest && isNewer(latest, current) ? latest : undefined;
}

/** Whether the background check is allowed by the environment. */
export function updateCheckEnabled(flag: boolean): boolean {
    if (!flag) return false;
    if (process.env.CI) return false;
    if (process.env.NO_UPDATE_NOTIFIER || process.env.DBX_NO_UPDATE_CHECK) return false;
    return true;
}

/**
 * Kick off the update check. Prints synchronously from the cache when a newer
 * version is already known, and again when the background fetch resolves with
 * one (whichever fires first, only once).
 */
export function runUpdateCheck(current: string, flag: boolean): void {
    if (!updateCheckEnabled(flag)) return;
    let printed = false;
    const notify = (latest: string): void => {
        if (printed) return;
        printed = true;
        logger.info('');
        logger.info(
            `A new version of ${UPDATE_PACKAGE} is available: ${latest} (you have ${current}).`
        );
        logger.info(`  Release notes: ${RELEASE_URL}/v${latest}`);
    };
    const cached = readCache();
    if (cached && isNewer(cached.latest, current)) notify(cached.latest);
    void checkForUpdate(current).then(latest => {
        if (latest) notify(latest);
    });
}
