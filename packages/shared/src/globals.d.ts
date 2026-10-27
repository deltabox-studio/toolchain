/**
 * Consumer-facing ambient metadata types for Zod's `.meta()`.
 *
 * Importing `@deltabox/toolchain/shared` (or the root package) brings this
 * declaration in, so `.meta({ env, description, required, ... })` is typed.
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
