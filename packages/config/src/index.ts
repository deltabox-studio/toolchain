/**
 * Generic Zod/env-backed configuration engine.
 *
 * Parses env vars into a tree, walks Zod config schemas (the single source of
 * truth) and generates `.env` files, env/config types, a JSON Schema, a markdown
 * reference, config metadata JSON and CLI options — all parameterized by an env
 * prefix and a set of scopes, so the same engine serves any project.
 */

export * from './collect.js';
export * from './config-json.js';
export * from './engine.js';
export * from './env.js';
export * from './env-file.js';
export * from './generated-format.js';
export * from './generators/index.js';
export * from './root.js';
export * from './schema.js';
export * from './types.js';
