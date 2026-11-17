/**
 * A tiny, dependency-free MCP (Model Context Protocol) stdio server.
 *
 * MCP is JSON-RPC 2.0 over a newline-delimited stdin/stdout stream. Only the
 * parts dbx needs are implemented: `initialize`, `ping`, `tools/list` and
 * `tools/call`. That keeps the package installable without the MCP SDK while
 * remaining wire-compatible with MCP clients.
 */

import type { McpTool, McpToolResult } from './types/index.js';

/** The MCP protocol revision this server implements. */
export const MCP_PROTOCOL_VERSION = '2025-06-18';

/** The server name advertised during initialization. */
export const MCP_SERVER_NAME = 'deltabox-toolchain';

export interface McpServerOptions {
    /** The project root tools run in. */
    cwd: string;
    /** The tool catalog. */
    tools: McpTool[];
    /** The advertised server version. */
    version?: string;
}

interface JsonRpcRequest {
    jsonrpc: '2.0';
    id?: string | number | null;
    method: string;
    params?: Record<string, unknown>;
}

interface JsonRpcSuccess {
    jsonrpc: '2.0';
    id: string | number | null;
    result: unknown;
}

interface JsonRpcError {
    jsonrpc: '2.0';
    id: string | number | null;
    error: { code: number; message: string; data?: unknown };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

function success(id: string | number | null, result: unknown): JsonRpcSuccess {
    return { jsonrpc: '2.0', id, result };
}

function failure(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown
): JsonRpcError {
    return {
        jsonrpc: '2.0',
        id,
        error: { code, message, ...(data !== undefined ? { data } : {}) },
    };
}

/** Convert an unknown thrown value into a tool result. */
function errorResult(error: unknown): McpToolResult {
    return {
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
    };
}

/** Create the request handler for a set of tools. */
export function createMcpServer(options: McpServerOptions) {
    const byName = new Map(options.tools.map(tool => [tool.name, tool]));
    const version = options.version ?? '0.0.0';

    return {
        /** Whether a message is a notification (no response is sent). */
        isNotification(message: JsonRpcRequest): boolean {
            return message.id === undefined;
        },

        /** Handle one JSON-RPC message and return the response (if any). */
        async handle(message: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
            // Notifications never get a response.
            if (message.id === undefined) return undefined;
            const id = message.id ?? null;
            try {
                switch (message.method) {
                    case 'initialize':
                        return success(id, {
                            protocolVersion: MCP_PROTOCOL_VERSION,
                            capabilities: { tools: {} },
                            serverInfo: { name: MCP_SERVER_NAME, version },
                        });
                    case 'ping':
                        return success(id, {});
                    case 'tools/list':
                        return success(id, {
                            tools: options.tools.map(tool => ({
                                name: tool.name,
                                description: tool.description,
                                inputSchema: tool.inputSchema,
                            })),
                        });
                    case 'tools/call': {
                        const params = message.params ?? {};
                        const name = params.name;
                        if (typeof name !== 'string') {
                            return failure(id, -32602, 'tools/call requires a string `name`.');
                        }
                        const tool = byName.get(name);
                        if (!tool) return failure(id, -32602, `unknown tool "${name}".`);
                        const args =
                            params.arguments &&
                            typeof params.arguments === 'object' &&
                            !Array.isArray(params.arguments)
                                ? (params.arguments as Record<string, unknown>)
                                : {};
                        const result = await tool
                            .handler(args, { cwd: options.cwd })
                            .catch(errorResult);
                        return success(id, result);
                    }
                    default:
                        return failure(id, -32601, `method "${message.method}" is not supported.`);
                }
            } catch (error) {
                return failure(id, -32603, error instanceof Error ? error.message : String(error));
            }
        },
    };
}

/** Read newline-delimited JSON-RPC messages from a stream and write responses. */
export async function serveStdio(
    server: ReturnType<typeof createMcpServer>,
    input: NodeJS.ReadableStream = process.stdin,
    output: NodeJS.WritableStream = process.stdout
): Promise<void> {
    let buffer = '';
    const write = (response: JsonRpcResponse): void => {
        output.write(`${JSON.stringify(response)}\n`);
    };
    await new Promise<void>((resolve, reject) => {
        input.setEncoding('utf-8');
        input.on('data', (chunk: string) => {
            buffer += chunk;
            let newline = buffer.indexOf('\n');
            while (newline !== -1) {
                const line = buffer.slice(0, newline).trim();
                buffer = buffer.slice(newline + 1);
                newline = buffer.indexOf('\n');
                if (!line) continue;
                let message: JsonRpcRequest;
                try {
                    const parsed = JSON.parse(line) as unknown;
                    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                        write(failure(null, -32600, 'invalid request'));
                        continue;
                    }
                    message = parsed as JsonRpcRequest;
                } catch {
                    write(failure(null, -32700, 'parse error'));
                    continue;
                }
                void server
                    .handle(message)
                    .then(response => {
                        if (response) write(response);
                    })
                    .catch(error => {
                        write(
                            failure(
                                null,
                                -32603,
                                error instanceof Error ? error.message : String(error)
                            )
                        );
                    });
            }
        });
        input.on('error', reject);
        input.on('end', resolve);
    });
}
