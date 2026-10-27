/**
 * The consumer-facing ambient config types.
 *
 * Add `/// <reference types="@deltabox/toolchain/globals" />` to a `.d.ts` file
 * (or `types` in `tsconfig.json`) to teach Zod's `.meta()` about the toolchain's
 * config metadata (`env`, `path`, `description`, `required`, ...).
 */
declare module 'zod/v4/core' {
    interface JSONSchemaMeta {
        /** The env var name, eg. `MYAPP_AUTH_PASSWORD`. */
        env?: string;
        /** The dotted config path, eg. `auth.password`. */
        path?: string;
        /** Whether the value has no safe default and must be set. */
        required?: boolean;
        /** An example value for the generated documentation. */
        example?: string | string[];
        /** Whether the value is a secret (never emitted/logged). */
        secret?: boolean;
        /** The scope the value belongs to. */
        scope?: string;
        /** Whether the value is safe to expose to the browser. */
        public?: boolean;
        /** The resolved-config default, when it differs from the env default. */
        defaultValue?: unknown;
    }
}

export {};
