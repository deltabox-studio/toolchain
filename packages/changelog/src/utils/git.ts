import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { sanitizeText } from '@deltabox/toolchain-shared';

import type { AuthorInfo, BumpType, CommitRecord, IssueInfo } from './types.js';

/** Read the commits in a git range (optionally limited to path(s)), newest first. */
export function readCommits(range: string, path?: string | string[]): CommitRecord[] {
    const format = '%H%x1f%s%x1f%b%x1f%an%x1f%ae%x1e';
    const paths = path === undefined ? [] : Array.isArray(path) ? path : [path];
    const args = ['log', '--no-merges', `--pretty=format:${format}`, range];
    if (paths.length > 0) args.push('--', ...paths);
    const log = execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return log
        .split('\x1e')
        .filter(record => record.length > 0)
        .map(record => {
            const [hash, subject, body, author, authorEmail] = record.split('\x1f');
            return {
                hash: hash!.trim(),
                subject: sanitizeText((subject ?? '').trim()),
                body: sanitizeText((body ?? '').trim()),
                author: (author ?? '').trim(),
                authorEmail: (authorEmail ?? '').trim(),
            };
        })
        .filter(record => record.subject.length > 0);
}

/** The `owner/name` slug of a GitHub URL, or undefined. */
function githubSlug(url: string): string | undefined {
    const match = url.match(/(?:github\.com[/:])([^/]+)\/([^/.]+?)(?:\.git)?$/);
    if (match?.[1] && match[2]) return `${match[1]}/${match[2]}`;
    return undefined;
}

/**
 * The `owner/name` slug of the `origin` remote. When there is no usable GitHub
 * remote (eg. a local clone), fall back to the root `package.json`
 * `repository.url` so commit links still resolve instead of pointing at
 * `https://github.com/undefined/...`.
 */
export function repoSlug(): string | undefined {
    try {
        const url = execFileSync('git', ['remote', 'get-url', 'origin'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        const slug = githubSlug(url);
        if (slug) return slug;
    } catch {
        // no remote configured
    }
    try {
        const raw = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
        const pkg = JSON.parse(raw) as { repository?: string | { url?: string } };
        const url = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
        if (url) return githubSlug(url);
    } catch {
        // no readable root package.json
    }
    return undefined;
}

let ghAvailable: boolean | undefined;

/** Probe `gh` auth once; skips every subsequent (doomed) gh API call when it's unavailable. */
function isGhAvailable(): boolean {
    if (ghAvailable !== undefined) return ghAvailable;
    try {
        execFileSync('gh', ['auth', 'status'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        ghAvailable = true;
    } catch {
        ghAvailable = false;
    }
    return ghAvailable;
}

const ghApiCache = new Map<string, string | undefined>();

function ghApi(repo: string, path: string, jq: string): string | undefined {
    if (!isGhAvailable()) return undefined;
    const key = `repos/${repo}${path}::${jq}`;
    if (ghApiCache.has(key)) return ghApiCache.get(key);
    let value: string | undefined;
    try {
        const out = execFileSync('gh', ['api', `repos/${repo}${path}`, '--jq', jq], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
        value = out && out !== 'null' ? out : undefined;
    } catch {
        value = undefined;
    }
    ghApiCache.set(key, value);
    return value;
}

function loginFromEmail(email: string): string | undefined {
    const match = /^(\d+)\+([^@]+)@users\.noreply\.github\.com$/.exec(email.trim());
    return match?.[2];
}

function isEmail(text: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

/** Resolve the GitHub author (login + profile URL) for a commit. */
export function resolveAuthorInfo(record: CommitRecord, repo: string | undefined): AuthorInfo {
    let login: string | undefined;
    if (repo) {
        // A PR can contain several commits: credit the PR author only.
        login = ghApi(repo, `/commits/${record.hash}/pulls`, '.[0].user.login');
        if (!login) login = ghApi(repo, `/commits/${record.hash}`, '.author.login');
    }
    if (!login) login = loginFromEmail(record.authorEmail);

    // Display the plain username only - never an email address.
    let name = login ?? record.author;
    if (isEmail(name)) name = loginFromEmail(name) ?? name.split('@')[0] ?? name;

    return { name, url: login ? `https://github.com/${login}` : undefined };
}

export function renderAuthor(author: AuthorInfo): string {
    return author.url ? `[${author.name}](${author.url})` : author.name;
}

function extractIssueNumbers(text: string): number[] {
    const numbers = new Set<number>();
    // GitHub's closing keywords: close, closes, closed, fix, fixes, fixed,
    // resolve, resolves, resolved (case-insensitive, optional colon).
    const regex = /\b(?:close[sd]?|fixe?s|fixed|resolves?|resolved)\b\s*:?\s*#(\d+)/gi;
    for (const match of text.matchAll(regex)) {
        const number = Number(match[1]);
        if (Number.isInteger(number)) numbers.add(number);
    }
    return [...numbers];
}

function fetchIssue(repo: string, number: number): IssueInfo {
    const info: IssueInfo = { number };
    const raw = ghApi(repo, `/issues/${number}`, '[.title,.html_url]');
    if (raw) {
        try {
            const parsed = JSON.parse(raw) as [string, string];
            info.title = parsed[0] || undefined;
            info.url = parsed[1] || undefined;
        } catch {
            // ignore malformed response
        }
    }
    return info;
}

export function recordIssues(record: CommitRecord, repo: string | undefined): IssueInfo[] {
    const numbers = extractIssueNumbers(`${record.subject}\n${record.body}`);
    if (numbers.length === 0) return [];
    if (!repo) return numbers.map(number => ({ number }));
    return numbers.map(number => fetchIssue(repo, number));
}

export function renderIssues(issues: IssueInfo[]): string {
    if (issues.length === 0) return '';
    const parts = issues.map(issue => {
        if (issue.url && issue.title) return `[#${issue.number} ${issue.title}](${issue.url})`;
        if (issue.url) return `[#${issue.number}](${issue.url})`;
        return `#${issue.number}`;
    });
    return ` (fixes ${parts.join(', ')})`;
}

/** The commit hash referenced by a changelog bullet (for date derivation). */
export function bulletHash(text: string): string | undefined {
    const match = /\[(#[0-9a-fA-F]{6,40})\]\([^)]*\)/.exec(text);
    return match?.[1]?.replace('#', '');
}

function gitCommitDate(hash: string): string | undefined {
    try {
        return execFileSync('git', ['log', '-1', '--format=%aI', hash], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
    } catch {
        return undefined;
    }
}

function gitTagDate(version: string): string | undefined {
    for (const tag of [`v${version}`, version]) {
        try {
            const date = execFileSync('git', ['log', '-1', '--format=%aI', tag], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }).trim();
            if (date) return date;
        } catch {
            // tag not found
        }
    }
    return undefined;
}

/** Best-effort release date for a version (tag, then newest commit hash). */
export function deriveVersionDate(version: string, bullets: string[]): Date | undefined {
    const tag = gitTagDate(version);
    if (tag) return new Date(tag);
    for (const bullet of bullets) {
        const hash = bulletHash(bullet);
        if (hash) {
            const date = gitCommitDate(hash);
            if (date) return new Date(date);
        }
    }
    return undefined;
}

let commitIndex: Map<string, { subject: string; body: string }> | undefined;

/** Lazily index every commit's original subject + body (one `git log` pass). */
function loadCommitIndex(): Map<string, { subject: string; body: string }> {
    if (commitIndex) return commitIndex;
    const map = new Map<string, { subject: string; body: string }>();
    try {
        const out = execFileSync(
            'git',
            ['log', '--no-merges', '--all', '--format=%H%x1f%s%x1f%b%x1e'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 128 * 1024 * 1024 }
        );
        for (const record of out.split('\x1e')) {
            if (!record.trim()) continue;
            const [hash = '', subject = '', body = ''] = record.split('\x1f');
            if (!hash) continue;
            const value = { subject: subject.trim(), body: body.trim() };
            map.set(hash.trim(), value);
            map.set(hash.trim().slice(0, 7), value);
        }
    } catch {
        // no git history available
    }
    commitIndex = map;
    return map;
}

/** Read a commit's original subject + body by hash (for correct CC parsing). */
export function readCommit(hash: string): { subject: string; body: string } | undefined {
    return loadCommitIndex().get(hash);
}

/** Derive the semver bump from the commits (major > minor > patch). */
export function deriveBump(records: CommitRecord[]): BumpType {
    let type: BumpType = 'patch';
    for (const record of records) {
        const message = `${record.subject}\n${record.body}`;
        // Conventional Commits: fix -> patch, feat -> minor, `!` or BREAKING CHANGE
        // footer -> major. Types are case-insensitive (spec section 15).
        if (
            /\bBREAKING CHANGE\b/.test(message) ||
            /^[a-zA-Z]+(\([^)]*\))?!:/.test(record.subject)
        ) {
            type = 'major';
        } else if (type !== 'major' && /^feat(\([^)]*\))?:/i.test(record.subject)) {
            type = 'minor';
        }
    }
    return type;
}
