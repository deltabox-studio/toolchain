import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { readJsoncFile } from '@deltabox/toolchain/shared';

import mcpPkg from '../package.json' with { type: 'json' };
import { createServeServer } from '../src/cli/index.js';
import { installMcp, listMcpProviders, vscodeUserDir } from '../src/install.js';
import { createMcpServer, MCP_PROTOCOL_VERSION, serveStdio } from '../src/protocol.js';
import {
    ALLOWED_COMMANDS,
    changelogToolArgs,
    defaultMcpTools,
    resolveDbxInvocation,
    tsconfigToolArgs,
} from '../src/tools.js';

const dirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-mcp-'));
    dirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function server(cwd = makeTmp()) {
    return createMcpServer({ cwd, tools: defaultMcpTools(), version: '1.2.3' });
}

describe('vscodeUserDir', () => {
    it('uses the platform-specific VS Code user directory', () => {
        expect(vscodeUserDir('win32', 'C:\\Users\\me', 'C:\\Users\\me\\AppData\\Roaming')).toBe(
            path.join('C:\\Users\\me\\AppData\\Roaming', 'Code', 'User')
        );
        expect(vscodeUserDir('darwin', '/Users/me')).toBe(
            path.join('/Users/me', 'Library', 'Application Support', 'Code', 'User')
        );
        expect(vscodeUserDir('linux', '/home/me')).toBe(
            path.join('/home/me', '.config', 'Code', 'User')
        );
    });
});

describe('dbx subprocess resolution', () => {
    it('walks up to a workspace root .bin shim', () => {
        const root = makeTmp();
        const bin = path.join(root, 'node_modules', '.bin');
        fs.mkdirSync(bin, { recursive: true });
        const shim = path.join(bin, process.platform === 'win32' ? 'dbx.cmd' : 'dbx');
        fs.writeFileSync(shim, '');
        const ws = path.join(root, 'packages', 'app');
        fs.mkdirSync(ws, { recursive: true });

        expect(resolveDbxInvocation(ws)).toEqual({ exe: shim, args: [] });
    });

    it('throws instead of spawning a bare dbx.cmd when nothing resolves', () => {
        const previous = process.env.PATH;
        process.env.PATH = '';
        try {
            expect(() => resolveDbxInvocation(makeTmp())).toThrow(/could not locate the dbx CLI/);
        } finally {
            process.env.PATH = previous;
        }
    });
});

describe('MCP protocol', () => {
    it('initializes with tool capabilities', async () => {
        const response = await server().handle({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
        });
        expect(response).toMatchObject({
            jsonrpc: '2.0',
            id: 1,
            result: {
                protocolVersion: MCP_PROTOCOL_VERSION,
                capabilities: { tools: {} },
                serverInfo: { name: 'deltabox-toolchain', version: '1.2.3' },
            },
        });
    });

    it('advertises the running package version, not a hardcoded 0.0.0', async () => {
        const response = await createServeServer(makeTmp()).handle({
            jsonrpc: '2.0',
            id: 9,
            method: 'initialize',
        });
        const info = (response as { result: { serverInfo: { version: string } } }).result
            .serverInfo;
        expect(info.version).toBe(mcpPkg.version);
        expect(info.version).not.toBe('0.0.0');
    });

    it('lists the dbx tools', async () => {
        const response = await server().handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
        const tools = (response as { result: { tools: { name: string }[] } }).result.tools;
        expect(tools.map(tool => tool.name)).toEqual(
            expect.arrayContaining([
                'dbx_sync',
                'dbx_projects',
                'dbx_providers',
                'dbx_templates',
                'dbx_migrate',
                'dbx_tsconfig',
                'dbx_run',
            ])
        );
    });

    it('returns no response for notifications', async () => {
        expect(
            await server().handle({ jsonrpc: '2.0', method: 'notifications/initialized' })
        ).toBeUndefined();
    });

    it('rejects unknown tools and methods', async () => {
        const unknownTool = await server().handle({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: { name: 'nope' },
        });
        expect(unknownTool).toMatchObject({ error: { code: -32602 } });
        const unknownMethod = await server().handle({
            jsonrpc: '2.0',
            id: 4,
            method: 'nope',
        });
        expect(unknownMethod).toMatchObject({ error: { code: -32601 } });
    });

    it('restricts the generic run tool to the allowlist', async () => {
        const response = await server().handle({
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: { name: 'dbx_run', arguments: { args: ['rm', '-rf', '.'] } },
        });
        expect(response).toMatchObject({ result: { isError: true } });
        expect(ALLOWED_COMMANDS.has('sync')).toBe(true);
        expect(ALLOWED_COMMANDS.has('rm')).toBe(false);
    });
});

describe('MCP tool arguments', () => {
    it("uses the tsconfig command's supported read-only flag", () => {
        expect(tsconfigToolArgs({ list: true })).toEqual(['tsconfig', '--json']);
        expect(tsconfigToolArgs({})).toEqual(['tsconfig']);
    });

    it('turns from/to into the changelog command `--range`', () => {
        expect(changelogToolArgs({ from: 'a', to: 'b' })).toEqual(['changelog', '--range', 'a..b']);
        expect(changelogToolArgs({ from: 'a' })).toEqual(['changelog', '--range', 'a..HEAD']);
        expect(changelogToolArgs({ to: 'b', dryRun: true })).toEqual([
            'changelog',
            '--range',
            'b',
            '--dry-run',
        ]);
        expect(changelogToolArgs({})).toEqual(['changelog']);
    });

    it('does not advertise flags the workflow command does not support', () => {
        const workflow = defaultMcpTools().find(tool => tool.name === 'dbx_workflow');
        expect(Object.keys(workflow?.inputSchema.properties ?? {})).toEqual(['workflow']);
    });
});

describe('MCP stdio robustness', () => {
    it('rejects a non-object JSON line and keeps serving', async () => {
        const input = Readable.from(['null\n', '{"jsonrpc":"2.0","id":2,"method":"ping"}\n']);
        let stdout = '';
        const output = new Writable({
            write(chunk, _encoding, callback) {
                stdout += String(chunk);
                callback();
            },
        });

        await serveStdio(server(), input as never, output as never);

        const lines = stdout
            .trim()
            .split('\n')
            .map(line => JSON.parse(line) as Record<string, unknown>);
        expect(lines[0]).toMatchObject({ id: null, error: { code: -32600 } });
        expect(lines[1]).toMatchObject({ id: 2, result: {} });
    });
});

describe('MCP installers', () => {
    it('lists the common providers plus a custom directory', () => {
        expect(listMcpProviders().map(provider => provider.id)).toEqual([
            'claude',
            'codex',
            'vscode',
            'opencode',
            'pi',
            'custom',
        ]);
    });

    it('writes a generic config + skill into a custom directory', () => {
        const dir = makeTmp();
        const result = installMcp({ provider: 'custom', dir, scope: 'project' });
        expect(result.configPath).toBe(path.join(dir, 'mcp.json'));
        expect(result.skillPath).toBe(path.join(dir, 'deltabox', 'SKILL.md'));
        const config = JSON.parse(fs.readFileSync(result.configPath, 'utf-8')) as {
            mcpServers: Record<string, { command: string; args: string[] }>;
        };
        expect(config.mcpServers.deltabox).toEqual({ command: 'dbx', args: ['mcp:serve'] });
        const skill = fs.readFileSync(result.skillPath as string, 'utf-8');
        expect(skill.startsWith('---\n')).toBe(true);
        expect(skill).toContain('description:');
        expect(skill).toContain('dbx_sync');
    });

    it('writes the VS Code `servers` shape and is idempotent', () => {
        const cwd = makeTmp();
        installMcp({ provider: 'vscode', cwd });
        const result = installMcp({ provider: 'vscode', cwd });
        const config = JSON.parse(fs.readFileSync(result.configPath, 'utf-8')) as {
            servers: Record<string, { type: string; command: string; args: string[] }>;
        };
        expect(config.servers.deltabox).toMatchObject({
            type: 'stdio',
            command: 'dbx',
            args: ['mcp:serve'],
        });
    });

    it('writes a Codex TOML block once', () => {
        const cwd = makeTmp();
        installMcp({ provider: 'codex', cwd });
        const result = installMcp({ provider: 'codex', cwd });
        const config = fs.readFileSync(result.configPath, 'utf-8');
        expect(config.match(/\[mcp_servers\.deltabox\]/g)).toHaveLength(1);
        expect(config).toContain('args = ["mcp:serve"]');
    });

    it('writes the OpenCode `mcp` shape', () => {
        const cwd = makeTmp();
        const result = installMcp({ provider: 'opencode', cwd });
        const config = JSON.parse(fs.readFileSync(result.configPath, 'utf-8')) as {
            mcp: Record<string, { type: string; command: string[]; enabled: boolean }>;
        };
        expect(config.mcp.deltabox).toEqual({
            type: 'local',
            command: ['dbx', 'mcp:serve'],
            enabled: true,
        });
    });

    it('preserves other servers and settings in a JSONC config', () => {
        const cwd = makeTmp();
        const configPath = path.join(cwd, '.vscode', 'mcp.json');
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(
            configPath,
            `{
    // Keep the user's existing servers.
    "servers": {
        "other": { "type": "stdio", "command": "other-server", "args": [] }
    },
    "inputs": []
}
`
        );

        installMcp({ provider: 'vscode', cwd });

        const text = fs.readFileSync(configPath, 'utf-8');
        expect(text).toContain("// Keep the user's existing servers.");
        const config = readJsoncFile<{
            servers: Record<string, { command?: string }>;
            inputs: unknown[];
        }>(configPath)!;
        expect(Object.keys(config.servers).sort()).toEqual(['deltabox', 'other']);
        expect(config.servers.other).toMatchObject({ command: 'other-server' });
        expect(config.inputs).toEqual([]);
    });

    it('refuses to overwrite an unparseable config', () => {
        const cwd = makeTmp();
        const configPath = path.join(cwd, '.vscode', 'mcp.json');
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, '{ not json');

        expect(() => installMcp({ provider: 'vscode', cwd })).toThrow(/cannot parse/);
        expect(fs.readFileSync(configPath, 'utf-8')).toBe('{ not json');
    });
});
