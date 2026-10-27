import type { ConfigMeta } from './types.js';

/**
 * Teach Zod's `.meta()` about the toolchain's config metadata (`env`, `path`,
 * `required`, `example`, ...), so a consumer's schemas are typed without casts.
 */
declare module 'zod/v4/core' {
    interface JSONSchemaMeta extends ConfigMeta {}
}

export {};
