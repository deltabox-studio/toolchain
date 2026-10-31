import type { ConfigMeta } from './types.ts';

/**
 * Consumer-facing ambient metadata types for Zod's `.meta()`.
 *
 * Importing `@deltabox/toolchain/shared` (or the root package) brings this
 * declaration in, so `.meta({ env, description, required, ... })` is typed.
 */
declare module 'zod/v4/core' {
    interface JSONSchemaMeta extends ConfigMeta {}
}

export {};
