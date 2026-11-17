/**
 * The dbx tool catalog exposed over MCP.
 *
 * Every tool drives the resolved `dbx` CLI in a subprocess, so the MCP surface
 * stays identical to the CLI/API surface (sync, projects, providers, templates,
 * changelog, migrations, tsconfig, workflows). The server never shells out
 * through an arbitrary command: `dbx_run` is limited to a command allowlist.
 */

import fs from 'node:fs';
import path from 'node:path';

import { findOwnCliEntry, spawnCross } from '@deltabox/toolchain/shared';

import type { McpTool, McpToolInputSchema, McpToolResult } from './types/index.js';

const IS_WINDOWS = process.platform === 'win32';

/** How long a tool call may run before it is killed. */
const TOOL_TIMEOUT_MS = 5 * 60 * 1000;

/** Commands `dbx_run` may invoke (long-running/interactive ones are excluded). */
export const ALLOWED_COMMANDS = new Set([
    'sync',
    'projects',
    'providers',
    'template:list',
    'template:info',
    'template:add',
    'template:remove',
    'changelog',
    'migrate',
    'migrate:list',
    'project:init',
    'project:init:monorepo',
    'project:init:workspace',
    'project:config',
    'tsconfig',
    'reset',
    'registry',
    'workflow',
]);

function localCandidates(dir: string): string[] {
    const base = path.join(dir, 'node_modules', '.bin', 'dbx');
    return IS_WINDOWS ? [`${base}.cmd`, `${base}.exe`, `${base}.ps1`, base] : [base];
}

/** The `dbx` shim in `cwd` or any ancestor (a workspace may not own one). */
function findWorkspaceBin(cwd: string): string | undefined {
    let dir = path.resolve(cwd);
    for (;;) {
        for (const candidate of localCandidates(dir)) {
            if (fs.existsSync(candidate)) return candidate;
        }
        const parent = path.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
}

/** The dbx CLI entry this process is running from, when it is dbx itself. */
function currentCliEntry(): string | undefined {
    const arg = process.argv[1];
    if (!arg || !/[/\\](?:dist|src)[/\\]cli[/\\]index\.(?:js|ts)$/.test(arg)) {
        return undefined;
    }
    try {
        return fs.realpathSync(arg);
    } catch {
        return arg;
    }
}

/** Look for `dbx` on `PATH` (never spawn a bare name that may not exist). */
function findOnPath(): string | undefined {
    const names = IS_WINDOWS ? ['dbx.cmd', 'dbx.exe', 'dbx.bat', 'dbx'] : ['dbx'];
    for (const entry of (process.env.PATH ?? '').split(path.delimiter)) {
        if (!entry) continue;
        for (const name of names) {
            const candidate = path.join(entry, name);
            if (fs.existsSync(candidate)) return candidate;
        }
    }
    return undefined;
}

/** Resolve the project's own `dbx` (never a bare PATH lookup when avoidable). */
export function resolveDbxInvocation(cwd: string): { exe: string; args: string[] } {
    const current = currentCliEntry();
    if (current) return { exe: process.execPath, args: [current] };
    const local = findWorkspaceBin(cwd);
    if (local) return { exe: local, args: [] };
    const own = findOwnCliEntry(cwd);
    if (own) return { exe: process.execPath, args: [own] };
    const onPath = findOnPath();
    if (onPath) return { exe: onPath, args: [] };
    throw new Error(
        'could not locate the dbx CLI: no running CLI entry, workspace `node_modules/.bin/dbx`, or `dbx` on PATH.'
    );
}

interface DbxResult {
    code: number;
    stdout: string;
    stderr: string;
    command: string;
}

/** Run `dbx <args>` in `cwd` and capture its output. */
export function runDbx(args: string[], cwd: string): Promise<DbxResult> {
    const resolved = resolveDbxInvocation(cwd);
    const command = [resolved.exe, ...resolved.args, ...args].join(' ');
    return new Promise<DbxResult>(resolve => {
        let stdout = '';
        let stderr = '';
        const child = spawnCross(resolved.exe, [...resolved.args, ...args], {
            cwd,
            env: process.env,
            stdio: 'pipe',
            timeoutMs: TOOL_TIMEOUT_MS,
        });
        child.stdout?.on('data', chunk => {
            stdout += chunk;
        });
        child.stderr?.on('data', chunk => {
            stderr += chunk;
        });
        child.on('error', error => {
            resolve({ code: 1, stdout, stderr: `${stderr}${String(error)}`, command });
        });
        child.on('exit', code => {
            resolve({ code: code ?? 0, stdout, stderr, command });
        });
    });
}

function resultOf(result: DbxResult): McpToolResult {
    const text = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n');
    return {
        ...(result.code !== 0 ? { isError: true } : {}),
        content: [
            {
                type: 'text',
                text:
                    text ||
                    (result.code === 0
                        ? `dbx command completed (no output): ${result.command}`
                        : `dbx command failed: ${result.command}`),
            },
        ],
    };
}

/** A simple object schema builder (keeps the catalog readable). */
function schema(
    properties: Record<string, { type: string; description: string; items?: unknown }>,
    required: string[] = []
): McpToolInputSchema {
    return {
        type: 'object',
        properties: properties as never,
        ...(required.length > 0 ? { required } : {}),
        additionalProperties: false,
    };
}

function stringArg(args: Record<string, unknown>, key: string): string | undefined {
    const value = args[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
}

function boolArg(args: Record<string, unknown>, key: string): boolean {
    return args[key] === true;
}

function stringArrayArg(args: Record<string, unknown>, key: string): string[] | undefined {
    const value = args[key];
    if (!Array.isArray(value)) return undefined;
    const strings = value.filter((item): item is string => typeof item === 'string');
    return strings.length > 0 ? strings : undefined;
}

/** The argv for the `dbx_tsconfig` tool (`--json` is the command's print mode). */
export function tsconfigToolArgs(args: Record<string, unknown>): string[] {
    const argv = ['tsconfig'];
    if (boolArg(args, 'list')) argv.push('--json');
    return argv;
}

/** The argv for the `dbx_changelog` tool (`from`/`to` become a `--range`). */
export function changelogToolArgs(args: Record<string, unknown>): string[] {
    const argv = ['changelog'];
    const from = stringArg(args, 'from');
    const to = stringArg(args, 'to');
    if (from && to) argv.push('--range', `${from}..${to}`);
    else if (from) argv.push('--range', `${from}..HEAD`);
    else if (to) argv.push('--range', to);
    if (boolArg(args, 'dryRun')) argv.push('--dry-run');
    return argv;
}

/** The default tool catalog. */
export function defaultMcpTools(): McpTool[] {
    return [
        {
            name: 'dbx_sync',
            description:
                'Regenerate every dbx-managed file (workflows, tsconfigs, Oxc files, catalogs, ...). Use `check` to verify drift without writing.',
            inputSchema: schema(
                {
                    cwd: { type: 'string', description: 'Project root (default: server cwd).' },
                    check: { type: 'boolean', description: 'Report drift without writing.' },
                    recursive: {
                        type: 'boolean',
                        description: 'Sync every managed project in dependency order.',
                    },
                    configless: {
                        type: 'boolean',
                        description: 'Manage projects without their own dbx.config.*.',
                    },
                    force: { type: 'boolean', description: 'Run even with no dbx config.' },
                    only: {
                        type: 'array',
                        description: 'Only run the named sync tasks (eg. ["tsconfig"]).',
                        items: { type: 'string' },
                    },
                },
                []
            ),
            async handler(args, context) {
                const argv = ['sync', '--json'];
                if (boolArg(args, 'check')) argv.push('--check');
                if (boolArg(args, 'recursive')) argv.push('--recursive');
                if (boolArg(args, 'configless')) argv.push('--configless');
                if (boolArg(args, 'force')) argv.push('--force');
                const only = stringArrayArg(args, 'only');
                if (only) argv.push('--only', only.join(','));
                const cwd = stringArg(args, 'cwd');
                if (cwd) argv.push('--cwd', cwd);
                return resultOf(await runDbx(argv, cwd ?? context.cwd));
            },
        },
        {
            name: 'dbx_projects',
            description: 'Discover the project graph (packages, workspaces and dependencies).',
            inputSchema: schema({
                cwd: { type: 'string', description: 'Root to scan.' },
            }),
            async handler(args, context) {
                const cwd = stringArg(args, 'cwd') ?? context.cwd;
                return resultOf(await runDbx(['projects', '--json', '--cwd', cwd], context.cwd));
            },
        },
        {
            name: 'dbx_providers',
            description:
                'List the tooling providers (Vite+, custom) with availability and commands.',
            inputSchema: schema({}),
            async handler(_args, context) {
                return resultOf(await runDbx(['providers', '--json'], context.cwd));
            },
        },
        {
            name: 'dbx_templates',
            description: 'List the available project/template sources.',
            inputSchema: schema({}),
            async handler(_args, context) {
                return resultOf(await runDbx(['template:list', '--json'], context.cwd));
            },
        },
        {
            name: 'dbx_template_info',
            description: 'Show one template descriptor (inputs, actions, source).',
            inputSchema: schema({ id: { type: 'string', description: 'Template id.' } }, ['id']),
            async handler(args, context) {
                const id = stringArg(args, 'id');
                if (!id)
                    return { isError: true, content: [{ type: 'text', text: '`id` required' }] };
                return resultOf(await runDbx(['template:info', id, '--json'], context.cwd));
            },
        },
        {
            name: 'dbx_changelog',
            description: 'Generate or preview the changelog for the project.',
            inputSchema: schema({
                from: { type: 'string', description: 'Start git ref.' },
                to: { type: 'string', description: 'End git ref.' },
                dryRun: { type: 'boolean', description: 'Preview without writing.' },
            }),
            async handler(args, context) {
                return resultOf(await runDbx(changelogToolArgs(args), context.cwd));
            },
        },
        {
            name: 'dbx_migrate',
            description:
                'Migrate an existing formatter/linter/vite config to dbx. Writes only when `write` is true.',
            inputSchema: schema({
                from: {
                    type: 'string',
                    description: 'Source: biome, prettier, dprint, eslint, oxc, vite, all.',
                },
                write: { type: 'boolean', description: 'Apply the migration (default preview).' },
            }),
            async handler(args, context) {
                const argv = ['migrate'];
                const from = stringArg(args, 'from');
                if (from) argv.push('--from', from);
                if (boolArg(args, 'write')) argv.push('--write');
                return resultOf(await runDbx(argv, context.cwd));
            },
        },
        {
            name: 'dbx_project_config',
            description: 'Generate a dbx config for projects that are missing one.',
            inputSchema: schema({
                language: { type: 'string', description: 'ts or js.' },
                force: { type: 'boolean', description: 'Overwrite an existing config.' },
            }),
            async handler(args, context) {
                const argv = ['project:config'];
                const language = stringArg(args, 'language');
                if (language) argv.push('--language', language);
                if (boolArg(args, 'force')) argv.push('--force');
                return resultOf(await runDbx(argv, context.cwd));
            },
        },
        {
            name: 'dbx_tsconfig',
            description: 'Manage the root workspaces tsconfig (paths and project references).',
            inputSchema: schema({
                list: { type: 'boolean', description: 'Print rather than write.' },
            }),
            async handler(args, context) {
                return resultOf(await runDbx(tsconfigToolArgs(args), context.cwd));
            },
        },
        {
            name: 'dbx_workflow',
            description: 'Run a generated workflow with its vendor CLI (gh/glab/az).',
            inputSchema: schema(
                {
                    workflow: { type: 'string', description: 'Workflow id or file name.' },
                },
                ['workflow']
            ),
            async handler(args, context) {
                const workflow = stringArg(args, 'workflow');
                if (!workflow)
                    return {
                        isError: true,
                        content: [{ type: 'text', text: '`workflow` required' }],
                    };
                return resultOf(await runDbx(['workflow', workflow], context.cwd));
            },
        },
        {
            name: 'dbx_run',
            description:
                'Run any safe dbx command with an explicit argument array (advanced escape hatch).',
            inputSchema: schema(
                {
                    args: {
                        type: 'array',
                        description: 'Arguments, eg. ["template:list", "--json"].',
                        items: { type: 'string' },
                    },
                },
                ['args']
            ),
            async handler(args, context) {
                const argv = stringArrayArg(args, 'args');
                if (!argv || argv.length === 0)
                    return { isError: true, content: [{ type: 'text', text: '`args` required' }] };
                if (!ALLOWED_COMMANDS.has(argv[0] as string)) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `command "${argv[0]}" is not allowed; use one of: ${[...ALLOWED_COMMANDS].join(', ')}`,
                            },
                        ],
                    };
                }
                return resultOf(await runDbx(argv, context.cwd));
            },
        },
    ];
}
