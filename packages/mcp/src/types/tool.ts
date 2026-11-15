import type { JsonValue } from './json.js';

/** The input schema exposed by an MCP tool (a JSON Schema object). */
export interface McpToolInputSchema {
    type: 'object';
    properties: Record<string, JsonValue>;
    required?: string[];
    additionalProperties?: boolean;
}

/** One content block in a tool result. */
export interface McpTextContent {
    type: 'text';
    text: string;
}

/** The result of calling a tool. */
export interface McpToolResult {
    content: McpTextContent[];
    isError?: boolean;
}

/** Context handed to every tool call. */
export interface McpToolContext {
    /** The project root the server runs in. */
    cwd: string;
}

/** A tool exposed over MCP. */
export interface McpTool {
    name: string;
    description: string;
    inputSchema: McpToolInputSchema;
    handler: (args: Record<string, unknown>, context: McpToolContext) => Promise<McpToolResult>;
}
