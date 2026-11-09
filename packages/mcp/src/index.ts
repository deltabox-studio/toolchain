/**
 * `@deltabox/toolchain-mcp` — the dbx Model Context Protocol surface.
 *
 * - a dependency-free MCP stdio server (`dbx mcp:serve`)
 * - a tool catalog mirroring the public dbx CLI/API
 * - installers for the common AI harnesses/editors (MCP config + skill)
 */

export * from './install.js';
export * from './protocol.js';
export * from './tools.js';
export type * from './types.js';
