/**
 * `@deltabox/toolchain-vite` — the Vite+ provider.
 *
 * Wraps the `vp` binary (Vite, Vitest, Oxlint, Oxfmt, Rolldown, tsdown) as
 * `dbx vite:*` commands, exposes a programmatic API for running it, and
 * manages a `vite.config.ts` when the `vite` config section is enabled.
 */

export * from './cli/index.js';
export * from './commands.js';
export * from './plugin.js';
export * from './provider.js';
export * from './sync.js';
export * from './vp.js';
