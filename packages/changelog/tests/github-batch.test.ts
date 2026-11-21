import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { CommitRecord } from '../src/types/index.js';

type GitUtils = typeof import('../src/utils/git.js');

const FAKE_GH = `import fs from 'node:fs';

const args = process.argv.slice(2);
const log = process.env.DBX_GH_LOG;
if (log) fs.appendFileSync(log, \`\${JSON.stringify(args)}\\n\`);

if (args[0] === 'auth' && args[1] === 'status') {
    process.exit(process.env.DBX_GH_FAIL_AUTH === '1' ? 1 : 0);
}

const endpoint = args[1] ?? '';

const failTimes = Number(process.env.DBX_GH_FAIL_TIMES ?? '0');
const failEndpoint = process.env.DBX_GH_FAIL_ENDPOINT ?? '';
if (failTimes > 0 && failEndpoint && endpoint.includes(failEndpoint)) {
    const counterFile = process.env.DBX_GH_FAIL_COUNTER;
    let count = 0;
    try {
        count = Number(fs.readFileSync(counterFile, 'utf8')) || 0;
    } catch {
        count = 0;
    }
    count += 1;
    if (counterFile) fs.writeFileSync(counterFile, String(count));
    if (count <= failTimes) {
        const http = process.env.DBX_GH_FAIL_HTTP;
        if (http) process.stderr.write(\`gh: Simulated (HTTP \${http})\\n\`);
        process.exit(1);
    }
}

if (args[0] === 'api' && args[1] === 'graphql') {
    if (process.env.DBX_GH_GRAPHQL_EMPTY === '1') {
        process.stdout.write(JSON.stringify({ data: { repository: null } }));
        process.exit(0);
    }
    const query = args.find(arg => arg.startsWith('query='))?.slice(6) ?? '';
    const every = Number(process.env.DBX_GH_PR_EVERY ?? '0');
    const noIssues = process.env.DBX_GH_ISSUE_EMPTY === '1';
    const repoMatch = /repository\\(owner: "([^"]+)", name: "([^"]+)"\\)/.exec(query);
    const repo = repoMatch ? \`\${repoMatch[1]}/\${repoMatch[2]}\` : 'myapp/app';
    const repository = {};
    for (const match of query.matchAll(/c(\\d+): object\\(oid: "([0-9a-f]+)"\\)/g)) {
        const index = Number(match[1]);
        const short = match[2].slice(0, 7);
        const nodes = every > 0 && index % every === 0
            ? [{ author: { login: \`pr-\${short}\` } }]
            : [];
        repository[\`c\${index}\`] = {
            author: { user: { login: \`author-\${short}\` } },
            associatedPullRequests: { nodes },
        };
    }
    for (const match of query.matchAll(/i(\\d+): issueOrPullRequest\\(number: (\\d+)\\)/g)) {
        const number = Number(match[2]);
        repository[\`i\${match[1]}\`] = noIssues
            ? null
            : {
                  title: \`Issue \${number}\`,
                  url: \`https://github.com/\${repo}/issues/\${number}\`,
              };
    }
    process.stdout.write(JSON.stringify({ data: { repository } }));
    process.exit(0);
}

if (endpoint.includes('/compare/')) {
    process.stdout.write(process.env.DBX_GH_COMPARE ?? '');
} else if (endpoint.endsWith('/pulls')) {
    process.stdout.write('legacy-pr');
} else if (endpoint.includes('/commits/')) {
    process.stdout.write('legacy-author');
} else if (endpoint.includes('/issues/')) {
    process.stdout.write(JSON.stringify(['Legacy title', 'https://example.test/issue']));
}
`;

const ENV_KEYS = [
    'DBX_GH_BIN',
    'DBX_GH_LOG',
    'DBX_GH_COMPARE',
    'DBX_GH_PR_EVERY',
    'DBX_GH_ISSUE_EMPTY',
    'DBX_GH_GRAPHQL_EMPTY',
    'DBX_GH_FAIL_AUTH',
    'DBX_GH_FAIL_TIMES',
    'DBX_GH_FAIL_ENDPOINT',
    'DBX_GH_FAIL_HTTP',
    'DBX_GH_FAIL_COUNTER',
    'DBX_GH_MAX_RETRIES',
    'DBX_GH_RETRY_DELAY',
    'DBX_NO_GH',
] as const;

function git(cwd: string, ...args: string[]): void {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function commitRecord(
    hash: string,
    subject: string,
    body = '',
    author = 'Test',
    authorEmail = 'test@example.com'
): CommitRecord {
    return { hash, subject, body, author, authorEmail };
}

describe('batched GitHub metadata', () => {
    const originalCwd = process.cwd();
    const saved = new Map<string, string | undefined>();
    let root: string;
    let logFile: string;
    let utils: GitUtils;

    beforeEach(async () => {
        for (const key of ENV_KEYS) saved.set(key, process.env[key]);
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-gh-batch-'));
        const fake = path.join(root, 'fake-gh.mjs');
        fs.writeFileSync(fake, FAKE_GH);
        logFile = path.join(root, 'gh.log');
        process.env.DBX_GH_BIN = fake;
        process.env.DBX_GH_LOG = logFile;
        process.env.DBX_GH_FAIL_COUNTER = path.join(root, 'gh-fail-count');
        process.env.DBX_GH_MAX_RETRIES = '0';
        process.env.DBX_GH_RETRY_DELAY = '0';
        const kept = new Set([
            'DBX_GH_BIN',
            'DBX_GH_LOG',
            'DBX_GH_FAIL_COUNTER',
            'DBX_GH_MAX_RETRIES',
            'DBX_GH_RETRY_DELAY',
        ]);
        for (const key of ENV_KEYS) {
            if (!kept.has(key)) delete process.env[key];
        }

        git(root, 'init');
        git(root, 'config', 'user.name', 'Test');
        git(root, 'config', 'user.email', 'test@example.com');
        for (let index = 0; index < 4; index += 1) {
            fs.writeFileSync(path.join(root, `file-${index}.txt`), `${index}\n`);
            git(root, 'add', '-A');
            git(root, 'commit', '-m', `fix: change ${index}`);
        }
        process.chdir(root);

        // A fresh module per test keeps the gh availability probe and every
        // request cache isolated.
        vi.resetModules();
        utils = await import('../src/utils/git.js');
    });

    afterEach(() => {
        process.chdir(originalCwd);
        for (const key of ENV_KEYS) {
            const value = saved.get(key);
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
        fs.rmSync(root, { recursive: true, force: true });
    });

    function hashes(): string[] {
        return execFileSync('git', ['log', '--format=%H'], {
            cwd: root,
            encoding: 'utf8',
        })
            .trim()
            .split(/\r?\n/);
    }

    function calls(): string[][] {
        if (!fs.existsSync(logFile)) return [];
        return fs
            .readFileSync(logFile, 'utf8')
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
            .map(line => JSON.parse(line) as string[]);
    }

    function graphqlQueries(): string[] {
        return calls()
            .filter(args => args[1] === 'graphql')
            .map(args => args.find(arg => arg.startsWith('query=')) ?? '');
    }

    function compareEndpoints(): string[] {
        return calls()
            .filter(args => args[1]?.includes('/compare/'))
            .map(args => args[1]!);
    }

    it('batches compare, PR and issue lookups into one request each', () => {
        const all = hashes();
        const records = all
            .slice(0, 3)
            .map((hash, index) =>
                commitRecord(
                    hash,
                    `fix: change ${2 - index}`,
                    index === 0 ? 'fixes #12' : index === 1 ? 'closes #34' : ''
                )
            );
        process.env.DBX_GH_COMPARE = records
            .map(record => `${record.hash}\tcompare-${record.hash.slice(0, 7)}`)
            .join('\n');
        process.env.DBX_GH_PR_EVERY = '2';

        utils.prefetchGitHubMetadata({
            repo: 'myapp/batch',
            range: `${all[3]}..HEAD`,
            commits: records,
        });

        const list = calls();
        const compareCalls = list.filter(args => args.some(arg => arg.includes('/compare/')));
        const graphqlCalls = list.filter(args => args[1] === 'graphql');
        expect(compareCalls).toHaveLength(1);
        // One commit batch (authors + PRs) and one issue batch.
        expect(graphqlCalls).toHaveLength(2);
        expect(list.some(args => args.some(arg => arg.includes('/pulls')))).toBe(false);
        expect(list.some(args => args.some(arg => arg.includes('/commits/')))).toBe(false);

        expect(utils.resolveAuthorInfo(records[0]!, 'myapp/batch').name).toBe(
            `pr-${records[0]!.hash.slice(0, 7)}`
        );
        expect(utils.resolveAuthorInfo(records[1]!, 'myapp/batch').name).toBe(
            `compare-${records[1]!.hash.slice(0, 7)}`
        );
        expect(utils.recordIssues(records[0]!, 'myapp/batch')).toEqual([
            {
                number: 12,
                title: 'Issue 12',
                url: 'https://github.com/myapp/batch/issues/12',
            },
        ]);
    });

    it('chunks commit lookups by 100', () => {
        const records = Array.from({ length: 250 }, (_, index) =>
            commitRecord(index.toString(16).padStart(40, '0'), 'fix: chunked')
        );

        utils.prefetchGitHubMetadata({ repo: 'myapp/chunk', commits: records });

        expect(graphqlQueries()).toHaveLength(3);
        expect(utils.resolveAuthorInfo(records[249]!, 'myapp/chunk').name).toBe(
            `author-${records[249]!.hash.slice(0, 7)}`
        );
        expect(calls().some(args => args.some(arg => arg.includes('/pulls')))).toBe(false);
    });

    it('chunks issue lookups by 100', () => {
        const numbers = Array.from({ length: 250 }, (_, index) => index + 1);
        const record = commitRecord(
            'a'.repeat(40),
            'fix: many issues',
            numbers.map(number => `fixes #${number}`).join('\n')
        );

        utils.prefetchGitHubMetadata({ repo: 'myapp/issue-batch', commits: [record] });

        const issueQueries = graphqlQueries().filter(query => query.includes('issueOrPullRequest'));
        expect(issueQueries).toHaveLength(3);
        const issues = utils.recordIssues(record, 'myapp/issue-batch');
        expect(issues).toHaveLength(250);
        expect(issues[0]).toEqual({
            number: 1,
            title: 'Issue 1',
            url: 'https://github.com/myapp/issue-batch/issues/1',
        });
        expect(issues[249]).toEqual({
            number: 250,
            title: 'Issue 250',
            url: 'https://github.com/myapp/issue-batch/issues/250',
        });
    });

    it('deduplicates issue numbers across commits', () => {
        const records = [
            commitRecord('b'.repeat(40), 'fix: first', 'fixes #7'),
            commitRecord('c'.repeat(40), 'fix: second', 'closes #7'),
        ];

        utils.prefetchGitHubMetadata({ repo: 'myapp/dedupe', commits: records });

        const issueQueries = graphqlQueries().filter(query => query.includes('issueOrPullRequest'));
        expect(issueQueries).toHaveLength(1);
        expect(issueQueries[0]).toContain('i0: issueOrPullRequest(number: 7)');
        expect(issueQueries[0]).not.toContain('i1:');
        expect(utils.recordIssues(records[0]!, 'myapp/dedupe')).toEqual([
            {
                number: 7,
                title: 'Issue 7',
                url: 'https://github.com/myapp/dedupe/issues/7',
            },
        ]);
        expect(utils.recordIssues(records[1]!, 'myapp/dedupe')).toEqual([
            {
                number: 7,
                title: 'Issue 7',
                url: 'https://github.com/myapp/dedupe/issues/7',
            },
        ]);
    });

    it('reuses the cache across repeated prefetch calls', () => {
        const records = [commitRecord('d'.repeat(40), 'fix: cached', 'fixes #5')];

        utils.prefetchGitHubMetadata({ repo: 'myapp/cache', commits: records });
        const first = calls();
        expect(first.length).toBeGreaterThan(0);

        utils.prefetchGitHubMetadata({ repo: 'myapp/cache', commits: records });
        expect(calls()).toHaveLength(first.length);
    });

    it('buildSummary prefetches before rendering each commit', async () => {
        git(root, 'remote', 'add', 'origin', 'https://github.com/myapp/summary.git');
        const all = hashes();
        const records = all
            .slice(0, 2)
            .map((hash, index) => commitRecord(hash, `fix: summary ${index}`));
        process.env.DBX_GH_COMPARE = records
            .map(record => `${record.hash}\tcompare-${record.hash.slice(0, 7)}`)
            .join('\n');
        process.env.DBX_GH_PR_EVERY = '2';

        const summary = await import('../src/utils/summary.js');
        const text = summary.buildSummary(records, { range: `${all[2]}..HEAD` });

        expect(compareEndpoints()).toHaveLength(1);
        expect(graphqlQueries()).toHaveLength(1);
        expect(text).toContain(`pr-${records[0]!.hash.slice(0, 7)}`);
        expect(text).toContain(`compare-${records[1]!.hash.slice(0, 7)}`);
        expect(calls().some(args => args[1]?.endsWith('/pulls'))).toBe(false);
    });

    it('resolves .., ... and single-rev ranges to compare SHAs', () => {
        const all = hashes();
        const records = all.map((hash, index) => commitRecord(hash, `fix: range ${index}`));
        process.env.DBX_GH_COMPARE = records
            .map(record => `${record.hash}\tcompare-${record.hash.slice(0, 7)}`)
            .join('\n');

        utils.prefetchGitHubMetadata({
            repo: 'myapp/ranges',
            range: `${all[3]}..HEAD`,
            commits: records,
        });
        utils.prefetchGitHubMetadata({
            repo: 'myapp/ranges',
            range: `${all[2]}...HEAD`,
            commits: records,
        });
        utils.prefetchGitHubMetadata({
            repo: 'myapp/ranges',
            range: 'HEAD',
            commits: records.slice(0, 1),
        });

        expect(compareEndpoints()).toEqual([
            `repos/myapp/ranges/compare/${all[3]}...${all[0]}`,
            `repos/myapp/ranges/compare/${all[2]}...${all[0]}`,
            `repos/myapp/ranges/compare/${all[1]}...${all[0]}`,
        ]);
        expect(utils.resolveAuthorInfo(records[0]!, 'myapp/ranges').name).toBe(
            `compare-${records[0]!.hash.slice(0, 7)}`
        );
        // The second and third ranges reuse the PR-author cache: only the first
        // prefetch queries GraphQL.
        expect(graphqlQueries()).toHaveLength(1);
    });

    it('skips compare for empty, identical, missing and option-like ranges', () => {
        const all = hashes();
        const records = all.map((hash, index) => commitRecord(hash, `fix: skip ${index}`));

        for (const range of [
            '',
            'HEAD..HEAD',
            '..HEAD',
            'HEAD..',
            '...HEAD',
            'missing-ref..HEAD',
            '-5..HEAD',
        ]) {
            utils.prefetchGitHubMetadata({ repo: 'myapp/skip', range, commits: records });
        }

        expect(compareEndpoints()).toEqual([]);
        expect(graphqlQueries()).toHaveLength(1);
    });

    it('fills authors from GraphQL when compare misses commits', () => {
        const all = hashes();
        const records = all
            .slice(0, 2)
            .map((hash, index) => commitRecord(hash, `fix: partial ${index}`));
        process.env.DBX_GH_COMPARE = `${records[1]!.hash}\tcompare-${records[1]!.hash.slice(0, 7)}`;

        utils.prefetchGitHubMetadata({
            repo: 'myapp/partial',
            range: `${all[2]}..HEAD`,
            commits: records,
        });

        expect(utils.resolveAuthorInfo(records[0]!, 'myapp/partial').name).toBe(
            `author-${records[0]!.hash.slice(0, 7)}`
        );
        expect(utils.resolveAuthorInfo(records[1]!, 'myapp/partial').name).toBe(
            `compare-${records[1]!.hash.slice(0, 7)}`
        );
    });

    it('skips GitHub lookups for commits that are not on a remote', () => {
        const all = hashes();
        git(root, 'update-ref', 'refs/remotes/origin/main', all[2]!);
        const records = all
            .slice(0, 3)
            .map((hash, index) => commitRecord(hash, `fix: remote ${index}`));

        utils.prefetchGitHubMetadata({
            repo: 'myapp/remote',
            range: `${all[3]}..HEAD`,
            commits: records,
        });

        // HEAD is unmoved from the remote tip, so compare is skipped.
        expect(compareEndpoints()).toEqual([]);
        const queries = graphqlQueries();
        expect(queries).toHaveLength(1);
        expect(queries[0]).toContain(`object(oid: "${all[2]}")`);
        expect(queries[0]).not.toContain(all[0]);
        expect(queries[0]).not.toContain(all[1]);
        expect(utils.resolveAuthorInfo(records[0]!, 'myapp/remote').name).toBe('Test');
        expect(utils.resolveAuthorInfo(records[2]!, 'myapp/remote').name).toBe(
            `author-${all[2]!.slice(0, 7)}`
        );
        expect(calls().some(args => args.some(arg => arg.includes('/pulls')))).toBe(false);

        // Once every commit is pushed, compare and GraphQL run again.
        git(root, 'update-ref', 'refs/remotes/origin/main', all[0]!);
        utils.prefetchGitHubMetadata({
            repo: 'myapp/pushed',
            range: `${all[1]}..HEAD`,
            commits: [records[0]!],
        });
        expect(compareEndpoints()).toHaveLength(1);
        expect(graphqlQueries()).toHaveLength(2);
    });

    it('falls back to per-commit REST when the GraphQL lookup yields no repository', () => {
        process.env.DBX_GH_GRAPHQL_EMPTY = '1';
        const record = commitRecord('f'.repeat(40), 'fix: graphql down', 'fixes #3');

        utils.prefetchGitHubMetadata({ repo: 'myapp/graphql-down', commits: [record] });

        expect(utils.resolveAuthorInfo(record, 'myapp/graphql-down').name).toBe('legacy-pr');
        expect(utils.recordIssues(record, 'myapp/graphql-down')).toEqual([
            {
                number: 3,
                title: 'Legacy title',
                url: 'https://example.test/issue',
            },
        ]);
        expect(calls().some(args => args[1]?.endsWith('/pulls'))).toBe(true);
        expect(calls().some(args => args[1]?.includes('/issues/3'))).toBe(true);
    });

    it('returns plain issue references when GitHub has no issue data', () => {
        process.env.DBX_GH_ISSUE_EMPTY = '1';
        const record = commitRecord('e'.repeat(40), 'fix: missing issue', 'fixes #99');

        utils.prefetchGitHubMetadata({ repo: 'myapp/no-issue', commits: [record] });

        expect(utils.recordIssues(record, 'myapp/no-issue')).toEqual([{ number: 99 }]);
    });

    it('disables gh when the auth probe fails', () => {
        process.env.DBX_GH_FAIL_AUTH = '1';
        const record = commitRecord(
            '1'.repeat(40),
            'fix: no auth',
            '',
            'Some One',
            '42+octocat@users.noreply.github.com'
        );

        utils.prefetchGitHubMetadata({ repo: 'myapp/no-auth', commits: [record] });

        expect(calls().filter(args => args[0] !== 'auth')).toHaveLength(0);
        expect(utils.resolveAuthorInfo(record, 'myapp/no-auth')).toEqual({
            name: 'octocat',
            url: 'https://github.com/octocat',
        });
    });

    it('retries failed calls within the budget before succeeding', () => {
        const all = hashes();
        const records = all
            .slice(0, 2)
            .map((hash, index) => commitRecord(hash, `fix: retry ${index}`));
        process.env.DBX_GH_COMPARE = records
            .map(record => `${record.hash}\tcompare-${record.hash.slice(0, 7)}`)
            .join('\n');
        process.env.DBX_GH_MAX_RETRIES = '3';
        process.env.DBX_GH_FAIL_TIMES = '2';
        process.env.DBX_GH_FAIL_ENDPOINT = '/compare/';
        process.env.DBX_GH_FAIL_HTTP = '500';

        utils.prefetchGitHubMetadata({
            repo: 'myapp/retry',
            range: `${all[2]}..HEAD`,
            commits: records,
        });

        expect(compareEndpoints()).toHaveLength(3);
        expect(utils.resolveAuthorInfo(records[0]!, 'myapp/retry').name).toBe(
            `compare-${records[0]!.hash.slice(0, 7)}`
        );
    });

    it('does not retry a terminal 404 and keeps gh enabled for other lookups', () => {
        const all = hashes();
        const records = all
            .slice(0, 2)
            .map((hash, index) => commitRecord(hash, `fix: terminal ${index}`));
        process.env.DBX_GH_MAX_RETRIES = '5';
        process.env.DBX_GH_FAIL_TIMES = '99';
        process.env.DBX_GH_FAIL_ENDPOINT = '/compare/';
        process.env.DBX_GH_FAIL_HTTP = '404';

        utils.prefetchGitHubMetadata({
            repo: 'myapp/terminal-404',
            range: `${all[2]}..HEAD`,
            commits: records,
        });

        expect(compareEndpoints()).toHaveLength(1);
        expect(graphqlQueries()).toHaveLength(1);
        expect(utils.resolveAuthorInfo(records[0]!, 'myapp/terminal-404').name).toBe(
            `author-${records[0]!.hash.slice(0, 7)}`
        );
    });

    it('stops gh on a 403 without retrying later calls', () => {
        const all = hashes();
        const records = all
            .slice(0, 2)
            .map((hash, index) => commitRecord(hash, `fix: forbidden ${index}`));
        process.env.DBX_GH_MAX_RETRIES = '5';
        process.env.DBX_GH_FAIL_TIMES = '99';
        process.env.DBX_GH_FAIL_ENDPOINT = '/compare/';
        process.env.DBX_GH_FAIL_HTTP = '403';

        utils.prefetchGitHubMetadata({
            repo: 'myapp/forbidden',
            range: `${all[2]}..HEAD`,
            commits: records,
        });

        expect(compareEndpoints()).toHaveLength(1);
        expect(graphqlQueries()).toHaveLength(0);
        expect(utils.resolveAuthorInfo(records[0]!, 'myapp/forbidden').name).toBe('Test');
    });

    it('disables gh after exhausting the retry budget', () => {
        const all = hashes();
        const record = commitRecord(
            all[0]!,
            'fix: give up',
            '',
            'Some One',
            '42+octocat@users.noreply.github.com'
        );
        process.env.DBX_GH_MAX_RETRIES = '1';
        process.env.DBX_GH_FAIL_TIMES = '99';
        process.env.DBX_GH_FAIL_ENDPOINT = '/compare/';

        utils.prefetchGitHubMetadata({
            repo: 'myapp/giveup',
            range: `${all[1]}..HEAD`,
            commits: [record],
        });

        expect(compareEndpoints()).toHaveLength(2);
        expect(graphqlQueries()).toHaveLength(0);
        expect(utils.resolveAuthorInfo(record, 'myapp/giveup')).toEqual({
            name: 'octocat',
            url: 'https://github.com/octocat',
        });
        expect(calls().some(args => args[1]?.endsWith('/pulls'))).toBe(false);
    });

    it('does nothing without commits or a repo slug', () => {
        utils.prefetchGitHubMetadata({ repo: 'myapp/none', commits: [] });
        expect(calls()).toHaveLength(0);

        utils.prefetchGitHubMetadata({ commits: [commitRecord('2'.repeat(40), 'fix: no repo')] });
        expect(calls()).toHaveLength(0);
    });

    it('keeps the per-commit lookups when the batch prefetch was not run', () => {
        const hash = 'f'.repeat(40);
        const record = commitRecord(hash, 'fix: legacy');

        expect(utils.resolveAuthorInfo(record, 'myapp/legacy').name).toBe('legacy-pr');
        expect(calls().some(args => args.some(arg => arg.includes(`/commits/${hash}/pulls`)))).toBe(
            true
        );
    });

    it('disables GitHub entirely with DBX_NO_GH', () => {
        process.env.DBX_NO_GH = '1';
        const hash = 'e'.repeat(40);
        const record = commitRecord(
            hash,
            'fix: offline',
            '',
            'test@example.com',
            '123+octocat@users.noreply.github.com'
        );

        utils.prefetchGitHubMetadata({ repo: 'myapp/offline', commits: [record] });

        expect(calls().filter(args => args[0] !== 'auth')).toHaveLength(0);
        expect(utils.resolveAuthorInfo(record, 'myapp/offline').name).toBe('octocat');
    });
});
