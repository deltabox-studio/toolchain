import { execFileSync } from 'node:child_process';
import path from 'node:path';

import {
    type ChangelogBreakingSetting,
    readJsonFile,
    sanitizeText,
} from '@deltabox/toolchain/shared';

import type { AuthorInfo, BumpType, CommitRecord, IssueInfo } from '../types/index.js';
import { isBreakingCommit } from './breaking.js';
import { repoRoot } from './repo.js';

/** Read the commits in a git range (optionally limited to path(s)), newest first. */
export function readCommits(range: string, path?: string | string[]): CommitRecord[] {
    const format = '%H%x1f%s%x1f%b%x1f%an%x1f%ae%x1e';
    const paths = path === undefined ? [] : Array.isArray(path) ? path : [path];
    const args = ['log', '--no-merges', `--pretty=format:${format}`, range];
    if (paths.length > 0) args.push('--', ...paths);
    const log = execFileSync('git', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        // Large ranges (or verbose bodies) can exceed Node's 1 MiB default.
        maxBuffer: 128 * 1024 * 1024,
    });
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

/** Whether `cwd` is inside a git work tree. */
export function isGitRepository(cwd: string = process.cwd()): boolean {
    try {
        return (
            execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
                cwd,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }).trim() === 'true'
        );
    } catch {
        return false;
    }
}

/**
 * The newest release boundary reachable from `HEAD`: the last generated
 * `chore: version packages (...)` / `release: ...` commit, else the nearest tag.
 * Used to scan only commits since the previous release when no range is given.
 */
export function lastReleaseRef(): string | undefined {
    try {
        const out = execFileSync(
            'git',
            [
                'log',
                '--no-merges',
                '-n',
                '1',
                '--format=%H',
                '--grep=^chore: version packages ',
                '--grep=^release: ',
                'HEAD',
            ],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim();
        const hash = out.split(/\r?\n/)[0]?.trim();
        if (hash) return hash;
    } catch {
        // no release commit
    }
    try {
        return (
            execFileSync('git', ['describe', '--tags', '--abbrev=0', 'HEAD'], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }).trim() || undefined
        );
    } catch {
        return undefined;
    }
}

/** Whether a commit subject is a generated release/version commit. */
export function isReleaseCommit(subject: string): boolean {
    return /^(?:chore: version packages\b|release:)/i.test(subject.trim());
}

/** The `owner/name` slug of a GitHub URL, or undefined. */
function githubSlug(url: string): string | undefined {
    // Repository names may contain dots (`next.js`); only a trailing `.git`
    // clone suffix is stripped.
    const match = url.match(/(?:github\.com[/:])([^/]+)\/(.+?)(?:\.git)?$/);
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
        const pkg = readJsonFile<{ repository?: string | { url?: string } }>(
            path.join(repoRoot(), 'package.json')
        );
        const url = typeof pkg?.repository === 'string' ? pkg.repository : pkg?.repository?.url;
        if (url) return githubSlug(url);
    } catch {
        // no readable root package.json
    }
    return undefined;
}

let ghAvailable: boolean | undefined;

/** Whether this process is a test runner (gh is disabled to keep tests offline). */
function isTestEnvironment(): boolean {
    return Boolean(
        process.env.VITEST ||
        process.env.VITEST_WORKER_ID ||
        process.env.VITEST_POOL_ID ||
        process.env.NODE_ENV === 'test'
    );
}

/**
 * The `gh` executable to run. `DBX_GH_BIN` overrides it; a JS entrypoint is
 * executed through Node so the same override works on Windows and POSIX.
 */
function ghCommand(): { command: string; prefix: string[] } {
    const bin = process.env.DBX_GH_BIN?.trim();
    if (!bin) return { command: 'gh', prefix: [] };
    if (/\.[cm]?js$/i.test(bin)) return { command: process.execPath, prefix: [bin] };
    return { command: bin, prefix: [] };
}

function execGh(args: string[], timeout: number): string {
    const { command, prefix } = ghCommand();
    return execFileSync(command, [...prefix, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout,
    }).trim();
}

/** Probe `gh` auth once; skips every subsequent (doomed) gh API call when it's unavailable. */
function isGhAvailable(): boolean {
    if (process.env.DBX_NO_GH || (isTestEnvironment() && !process.env.DBX_GH_BIN)) {
        ghAvailable = false;
        return false;
    }
    if (ghAvailable !== undefined) return ghAvailable;
    try {
        execGh(['auth', 'status'], 2000);
        ghAvailable = true;
    } catch {
        ghAvailable = false;
    }
    return ghAvailable;
}

const ghApiCache = new Map<string, string | undefined>();
const ghGraphQLCache = new Map<string, unknown>();

/** Retries after the first `gh api` failure (default 5). */
const GH_API_DEFAULT_MAX_RETRIES = 5;
/** Delay between `gh api` retries (default 3000ms). */
const GH_API_DEFAULT_RETRY_DELAY_MS = 3000;
/** Commits/issues per batched GraphQL request (GitHub caps node aliases at 100). */
const GH_BATCH_SIZE = 100;

function envNumber(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined || raw.trim() === '') return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return fallback;
    return Math.floor(value);
}

function waitSync(ms: number): void {
    if (ms <= 0) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function ghFailureStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const record = error as { stdout?: unknown; stderr?: unknown };
    const text = `${typeof record.stderr === 'string' ? record.stderr : ''}\n${
        typeof record.stdout === 'string' ? record.stdout : ''
    }`;
    const match = /\bHTTP[ /](\d{3})\b/i.exec(text) ?? /"status"\s*:\s*"?(\d{3})"?/.exec(text);
    return match ? Number(match[1]) : undefined;
}

/**
 * Whether a failed gh call is worth retrying. A 404 (eg. comparing an unpushed
 * ref) or another client error is terminal, so retrying it only delays the run;
 * network errors, timeouts, 408/429 and 5xx responses are retried instead.
 */
function isRetryableGhFailure(error: unknown): boolean {
    const status = ghFailureStatus(error);
    if (status === undefined) return true;
    if (status === 408 || status === 429) return true;
    return status >= 500;
}

/** Run a gh command with the configured retry budget; gives up for the run. */
function ghWithRetries(run: () => string): string | undefined {
    const retries = envNumber('DBX_GH_MAX_RETRIES', GH_API_DEFAULT_MAX_RETRIES);
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return run();
        } catch (error) {
            if (!isRetryableGhFailure(error)) {
                // Auth/scope failures also stop every later call, so don't keep
                // probing them one request at a time.
                const status = ghFailureStatus(error);
                if (status === 401 || status === 403) ghAvailable = false;
                return undefined;
            }
            if (attempt >= retries) {
                // Give up after the retry budget: stop calling gh for the rest of
                // the run and fall back to plain git metadata.
                ghAvailable = false;
                return undefined;
            }
            waitSync(envNumber('DBX_GH_RETRY_DELAY', GH_API_DEFAULT_RETRY_DELAY_MS));
        }
    }
    return undefined;
}

interface GhApiOptions {
    /** Follow every page of a paginated endpoint (`gh api --paginate`). */
    paginate?: boolean;
    timeout?: number;
}

function ghApi(
    repo: string,
    path: string,
    jq: string,
    options: GhApiOptions = {}
): string | undefined {
    if (!isGhAvailable()) return undefined;
    const paginate = options.paginate === true;
    const key = `repos/${repo}${path}::${jq}::${paginate ? 'p' : 's'}`;
    if (ghApiCache.has(key)) return ghApiCache.get(key);
    const args = ['api', `repos/${repo}${path}`];
    if (paginate) args.push('--paginate');
    args.push('--jq', jq);
    const out = ghWithRetries(() => execGh(args, options.timeout ?? 5000));
    const value = out && out !== 'null' ? out : undefined;
    ghApiCache.set(key, value);
    return value;
}

/** Run a batched GraphQL query, caching the `data` payload by query text. */
function ghGraphQL<T>(query: string): T | undefined {
    if (!isGhAvailable()) return undefined;
    if (ghGraphQLCache.has(query)) return ghGraphQLCache.get(query) as T | undefined;
    let value: T | undefined;
    const out = ghWithRetries(() => execGh(['api', 'graphql', '-f', `query=${query}`], 20_000));
    if (out) {
        try {
            value = (JSON.parse(out) as { data?: T }).data;
        } catch {
            value = undefined;
        }
    }
    ghGraphQLCache.set(query, value);
    return value;
}

function commitKey(repo: string, hash: string): string {
    return `${repo}#${hash}`;
}

function issueKey(repo: string, number: number): string {
    return `${repo}#${number}`;
}

const pullRequestAuthorCache = new Map<string, string | undefined>();
const pullRequestAuthorKnown = new Set<string>();
const commitAuthorCache = new Map<string, string | undefined>();
const commitAuthorKnown = new Set<string>();
const issueInfoCache = new Map<string, IssueInfo | undefined>();
const comparePrefetched = new Set<string>();

function splitRepo(repo: string): { owner: string; name: string } {
    const [owner = '', name = ''] = repo.split('/');
    return { owner, name };
}

function gql(value: string): string {
    return JSON.stringify(value);
}

/** Split a git range into its compare endpoints (a single rev compares against its parent). */
function splitRange(range: string): { base: string; head: string } | undefined {
    const trimmed = range.trim();
    if (!trimmed || trimmed.startsWith('-')) return undefined;
    const separator = trimmed.includes('...') ? '...' : trimmed.includes('..') ? '..' : undefined;
    if (!separator) return { base: `${trimmed}~1`, head: trimmed };
    const [base, head] = trimmed.split(separator);
    if (!base || !head) return undefined;
    return { base, head };
}

function resolveCommitish(ref: string): string | undefined {
    try {
        return (
            execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }).trim() || undefined
        );
    } catch {
        return undefined;
    }
}

/**
 * The commits in `range` that no remote-tracking ref reaches. GitHub cannot
 * look these up yet (a compare or GraphQL lookup returns null/404), so skipping
 * them keeps a local dry-run from spending seconds on doomed requests.
 *
 * `undefined` means "unknown" (no remote refs, or git failed): query everything
 * normally. An empty set means every commit in the range is already pushed.
 */
function unpushedHashes(range: string): Set<string> | undefined {
    try {
        if (
            !execFileSync('git', ['for-each-ref', '--count=1', 'refs/remotes'], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }).trim()
        ) {
            return undefined;
        }
        const out = execFileSync('git', ['rev-list', '--no-merges', range, '--not', '--remotes'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            maxBuffer: 128 * 1024 * 1024,
        });
        return new Set(out.split(/\r?\n/).filter(Boolean));
    } catch {
        return undefined;
    }
}

/**
 * One REST `compare` request per range resolves the commit authors/committers
 * GitHub knows about, avoiding a request per commit. Compare is limited to the
 * commits reachable from the head ref; anything missing is filled by the
 * batched GraphQL commit lookup.
 */
function prefetchCompareAuthors(repo: string, range: string, unpushed?: ReadonlySet<string>): void {
    const refs = splitRange(range);
    if (!refs) return;
    const cacheKey = `${repo}::${range}`;
    if (comparePrefetched.has(cacheKey)) return;
    const base = resolveCommitish(refs.base);
    const head = resolveCommitish(refs.head);
    if (!base || !head || base === head) return;
    // Comparing an unpushed endpoint always 404s; let the GraphQL lookup cover
    // any commits that are on the remote instead.
    if (unpushed?.has(base) || unpushed?.has(head)) return;
    comparePrefetched.add(cacheKey);
    const jq = '.commits[] | [.sha, (.author.login // "")] | @tsv';
    const out = ghApi(repo, `/compare/${base}...${head}`, jq, {
        paginate: true,
        timeout: 20_000,
    });
    if (!out) return;
    for (const line of out.split(/\r?\n/)) {
        if (!line.trim()) continue;
        const [sha = '', login = ''] = line.split('\t');
        if (!sha) continue;
        const key = commitKey(repo, sha.trim());
        commitAuthorCache.set(key, login.trim() || undefined);
        commitAuthorKnown.add(key);
    }
}

interface GitHubCommitNode {
    author?: { user?: { login?: string | null } | null } | null;
    associatedPullRequests?: {
        nodes?: Array<{ author?: { login?: string | null } | null } | null> | null;
    } | null;
}

/**
 * GraphQL commit lookup in batches of 100: credits the PR author when the
 * commit belongs to a PR, and fills the commit author for commits the compare
 * endpoint did not return (eg. unpushed or beyond the compare page cap).
 */
function prefetchCommitMetadata(repo: string, hashes: string[]): void {
    const pending = hashes.filter(hash => !pullRequestAuthorKnown.has(commitKey(repo, hash)));
    if (pending.length === 0) return;
    const { owner, name } = splitRepo(repo);
    for (let start = 0; start < pending.length; start += GH_BATCH_SIZE) {
        const batch = pending.slice(start, start + GH_BATCH_SIZE);
        const fields = batch.map(
            (hash, index) =>
                `c${index}: object(oid: ${gql(hash)}) { ... on Commit { author { user { login } } associatedPullRequests(first: 1) { nodes { author { login } } } } }`
        );
        const query = `query { repository(owner: ${gql(owner)}, name: ${gql(name)}) { ${fields.join(' ')} } }`;
        const repository = ghGraphQL<{ repository?: Record<string, GitHubCommitNode | null> }>(
            query
        )?.repository;
        if (!repository) continue;
        batch.forEach((hash, index) => {
            const node = repository[`c${index}`];
            const key = commitKey(repo, hash);
            pullRequestAuthorCache.set(
                key,
                node?.associatedPullRequests?.nodes?.[0]?.author?.login ?? undefined
            );
            pullRequestAuthorKnown.add(key);
            if (!commitAuthorKnown.has(key)) {
                commitAuthorCache.set(key, node?.author?.user?.login ?? undefined);
                commitAuthorKnown.add(key);
            }
        });
    }
}

interface GitHubIssueNode {
    title?: string | null;
    url?: string | null;
}

/** Resolve issue titles/links with aliased GraphQL lookups, batched 100 at a time. */
function prefetchIssueMetadata(repo: string, numbers: number[]): void {
    const pending = numbers.filter(number => !issueInfoCache.has(issueKey(repo, number)));
    if (pending.length === 0) return;
    const { owner, name } = splitRepo(repo);
    for (let start = 0; start < pending.length; start += GH_BATCH_SIZE) {
        const batch = pending.slice(start, start + GH_BATCH_SIZE);
        const fields = batch.map(
            (number, index) =>
                `i${index}: issueOrPullRequest(number: ${number}) { ... on Issue { title url } ... on PullRequest { title url } }`
        );
        const query = `query { repository(owner: ${gql(owner)}, name: ${gql(name)}) { ${fields.join(' ')} } }`;
        const repository = ghGraphQL<{ repository?: Record<string, GitHubIssueNode | null> }>(
            query
        )?.repository;
        if (!repository) continue;
        batch.forEach((number, index) => {
            const node = repository[`i${index}`];
            const info: IssueInfo = { number };
            if (node?.title) info.title = node.title;
            if (node?.url) info.url = node.url;
            issueInfoCache.set(issueKey(repo, number), node ? info : undefined);
        });
    }
}

export interface GitHubMetadataOptions {
    /** The `owner/name` slug; defaults to the origin remote / package.json. */
    repo?: string;
    /** The scanned git range (enables the single REST compare for authors). */
    range?: string;
    /** The commits that will be rendered. */
    commits: CommitRecord[];
}

/**
 * Batch the GitHub lookups for a changelog run: one compare request per range,
 * GraphQL PR/author lookups in batches of 100 commits, and aliased issue
 * lookups. Safe to call repeatedly (results are cached) and to call when `gh`
 * is missing or unauthenticated (it becomes a no-op).
 */
export function prefetchGitHubMetadata(options: GitHubMetadataOptions): void {
    const repo = options.repo ?? repoSlug();
    if (!repo || options.commits.length === 0 || !isGhAvailable()) return;
    const hashes = [...new Set(options.commits.map(record => record.hash))];
    const numbers = [
        ...new Set(
            options.commits.flatMap(record =>
                extractIssueNumbers(`${record.subject}\n${record.body}`)
            )
        ),
    ];
    // Commits that are not on a remote cannot be resolved by GitHub. Mark them
    // as looked-up (without data) so rendering falls back to git immediately
    // instead of trying a request per commit.
    const unpushed = options.range ? unpushedHashes(options.range) : undefined;
    if (unpushed) {
        for (const hash of hashes) {
            if (!unpushed.has(hash)) continue;
            const key = commitKey(repo, hash);
            pullRequestAuthorCache.set(key, undefined);
            pullRequestAuthorKnown.add(key);
            if (!commitAuthorKnown.has(key)) {
                commitAuthorCache.set(key, undefined);
                commitAuthorKnown.add(key);
            }
        }
    }
    if (options.range) prefetchCompareAuthors(repo, options.range, unpushed);
    const remoteHashes = unpushed ? hashes.filter(hash => !unpushed.has(hash)) : hashes;
    if (remoteHashes.length > 0) prefetchCommitMetadata(repo, remoteHashes);
    if (numbers.length > 0) prefetchIssueMetadata(repo, numbers);
}

function loginFromEmail(email: string): string | undefined {
    const match = /^(\d+)\+([^@]+)@users\.noreply\.github\.com$/.exec(email.trim());
    return match?.[2];
}

function isEmail(text: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function resolvePullRequestAuthor(repo: string, hash: string): string | undefined {
    const key = commitKey(repo, hash);
    if (pullRequestAuthorKnown.has(key)) return pullRequestAuthorCache.get(key);
    return ghApi(repo, `/commits/${hash}/pulls`, '.[0].user.login');
}

function resolveCommitAuthor(repo: string, hash: string): string | undefined {
    const key = commitKey(repo, hash);
    if (commitAuthorKnown.has(key)) return commitAuthorCache.get(key);
    return ghApi(repo, `/commits/${hash}`, '.author.login');
}

/** Resolve the GitHub author (login + profile URL) for a commit. */
export function resolveAuthorInfo(record: CommitRecord, repo: string | undefined): AuthorInfo {
    let login: string | undefined;
    if (repo) {
        // A PR can contain several commits: credit the PR author only.
        login = resolvePullRequestAuthor(repo, record.hash);
        if (!login) login = resolveCommitAuthor(repo, record.hash);
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
    const regex = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b\s*:?\s*#(\d+)/gi;
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
    return numbers.map(number => {
        const key = issueKey(repo, number);
        if (issueInfoCache.has(key)) return issueInfoCache.get(key) ?? { number };
        return fetchIssue(repo, number);
    });
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

/**
 * The author keys (lowercased email + name) of every commit reachable from the
 * start of a scanned range. Used to find first-time contributors. Returns
 * `undefined` when the range has no usable boundary (eg. no git history).
 */
const priorAuthorsCache = new Map<string, Set<string> | undefined>();

export function readPriorAuthors(range: string, oldestHash?: string): Set<string> | undefined {
    const key = `${range}::${oldestHash ?? ''}`;
    if (priorAuthorsCache.has(key)) return priorAuthorsCache.get(key);

    const trimmed = range.trim();
    const rangeStart = trimmed.includes('..') ? (trimmed.split('..')[0] ?? '').trim() : '';
    const boundary = rangeStart || (oldestHash ? `${oldestHash}^` : undefined);
    if (!boundary) {
        priorAuthorsCache.set(key, undefined);
        return undefined;
    }

    let out: string;
    try {
        out = execFileSync('git', ['log', '--no-merges', '--format=%ae%x1f%an%x1e', boundary], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            maxBuffer: 128 * 1024 * 1024,
        });
    } catch {
        // We cannot tell who is new when the boundary does not resolve (a root
        // commit or an invalid ref), so never guess and list everyone.
        priorAuthorsCache.set(key, undefined);
        return undefined;
    }

    const authors = new Set<string>();
    for (const record of out.split('\x1e')) {
        if (!record.trim()) continue;
        const [email = '', name = ''] = record.split('\x1f');
        for (const value of [email, name]) {
            const normalized = value.trim().toLowerCase();
            if (normalized) authors.add(normalized);
        }
    }
    priorAuthorsCache.set(key, authors);
    return authors;
}

/** The commit hash referenced by a changelog bullet (for date derivation). */
export function bulletHash(text: string): string | undefined {
    const linked = /\[(#[0-9a-fA-F]{6,40})\]\([^)]*\)/.exec(text);
    if (linked) return linked[1]?.replace('#', '');
    const bare = /(?:^|[\s(])#([0-9a-fA-F]{7,40})\b/.exec(text);
    return bare?.[1];
}

function gitTagDate(version: string): string | undefined {
    const map = loadTagDates();
    return map.get(`v${version}`) ?? map.get(version);
}

let tagDateCache: { cwd: string; dates: Map<string, string> } | undefined;

/** One `for-each-ref` pass over the tags (name -> commit date). */
function loadTagDates(): Map<string, string> {
    const cwd = process.cwd();
    if (tagDateCache?.cwd === cwd) return tagDateCache.dates;
    const map = new Map<string, string>();
    try {
        const out = execFileSync(
            'git',
            ['for-each-ref', '--format=%(refname:short) %(creatordate:iso-strict)', 'refs/tags'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }
        );
        for (const line of out.split('\n')) {
            const separator = line.indexOf(' ');
            if (separator === -1) continue;
            const name = line.slice(0, separator);
            const date = line.slice(separator + 1).trim();
            if (name && date) map.set(name, date);
        }
    } catch {
        // no tags
    }
    tagDateCache = { cwd, dates: map };
    return map;
}

/** Best-effort release date for a version (tag, then newest commit hash). */
export function deriveVersionDate(version: string, bullets: string[]): Date | undefined {
    const tag = gitTagDate(version);
    if (tag) return new Date(tag);
    for (const bullet of bullets) {
        const hash = bulletHash(bullet);
        if (hash) {
            const date = readCommitDate(hash);
            if (date) return new Date(date);
        }
    }
    return undefined;
}

let commitIndex:
    | { cwd: string; index: Map<string, { subject: string; body: string; date: string }> }
    | undefined;

/** Lazily index every commit's original subject, body and author date (one `git log` pass). */
function loadCommitIndex(): Map<string, { subject: string; body: string; date: string }> {
    const cwd = process.cwd();
    if (commitIndex?.cwd === cwd) return commitIndex.index;
    const map = new Map<string, { subject: string; body: string; date: string }>();
    try {
        const out = execFileSync(
            'git',
            ['log', '--no-merges', '--all', '--format=%H%x1f%s%x1f%b%x1f%aI%x1e'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 128 * 1024 * 1024 }
        );
        for (const record of out.split('\x1e')) {
            if (!record.trim()) continue;
            const [hash = '', subject = '', body = '', date = ''] = record.split('\x1f');
            if (!hash) continue;
            const value = { subject: subject.trim(), body: body.trim(), date: date.trim() };
            map.set(hash.trim(), value);
            map.set(hash.trim().slice(0, 7), value);
        }
    } catch {
        // no git history available
    }
    commitIndex = { cwd, index: map };
    return map;
}

/** Read a commit's original subject + body by hash (for correct CC parsing). */
export function readCommit(hash: string): { subject: string; body: string } | undefined {
    return loadCommitIndex().get(hash);
}

/** Read a commit's author date by full or short hash (from the lazy index). */
export function readCommitDate(hash: string): string | undefined {
    return loadCommitIndex().get(hash)?.date || undefined;
}

let completeHistory: boolean | undefined;

/**
 * Whether `git log --all` can resolve every commit the changelog may reference.
 * A shallow clone (or a missing git history) cannot, so callers should fall
 * back to a heuristic instead of treating every unresolved hash as an issue.
 */
export function hasCompleteGitHistory(): boolean {
    if (completeHistory === undefined) {
        try {
            const out = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }).trim();
            completeHistory = out !== 'true';
        } catch {
            completeHistory = false;
        }
    }
    return completeHistory;
}

/** Derive the semver bump from the commits (major > minor > patch). */
export function deriveBump(records: CommitRecord[], breaking?: ChangelogBreakingSetting): BumpType {
    let type: BumpType = 'patch';
    for (const record of records) {
        // Conventional Commits: fix -> patch, feat -> minor, `!` or a
        // BREAKING CHANGE footer -> major. `breaking` can override detection.
        if (isBreakingCommit(record, breaking)) {
            type = 'major';
        } else if (type !== 'major' && /^feat(\([^)]*\))?:/i.test(record.subject)) {
            type = 'minor';
        }
    }
    return type;
}
