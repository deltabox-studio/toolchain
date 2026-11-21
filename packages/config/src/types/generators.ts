import type { CollectOptions } from './collect.js';
import type { ConfigEngineOptions } from './engine.js';

/** `.env` file generation options. */
export interface GenerateEnvFileOptions extends GenerateBaseOptions {
    /** Env vars to include. @default all */
    include?: string[];
    /** Env vars to exclude. */
    exclude?: string[];
    /** Default values to inject (overrides the schema defaults). */
    values?: Record<string, string>;
    /** Comment banner placed at the top of the file. */
    header?: string;
    /** Only emit these scopes. @default every registered scope */
    scopes?: string[];
    /** The env-var prefix. @default "APP_" */
    envPrefix?: string;
    /** Omit descriptions (emit bare assignments). */
    bare?: boolean;
    /** Extra raw `NAME=value` lines appended after the schema vars. */
    extra?: Record<string, string>;
    /** The characters wrapping a scope's section header. @default "----" */
    scopeSeparator?: string;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectOptions['envPathOf'];
}

/** Env type generation options (`env.ts` + `dbx-env.d.ts`). */
export interface GenerateEnvTypesOptions extends GenerateBaseOptions {
    /** Output directory. `false` (or omitted) disables writing. */
    outputDir?: string | false;
    /** The env-var prefix. @default "APP_" */
    envPrefix?: string;
    /** The `process.env` interface name. @default "AppEnv" */
    envInterfaceName?: string;
    /** The `import.meta.env` interface name. @default "AppViteEnv" */
    viteEnvInterfaceName?: string;
    /** The generated types file name. @default "env.ts" */
    envFile?: string;
    /** The generated ambient file name. @default "dbx-env.d.ts" */
    dtsFile?: string;
    /** The import specifier the `.d.ts` uses for the env types. */
    importPath?: string;
    /** A header comment prepended to both files. */
    header?: string;
    /** A raw (verbatim) header replacing the generated one in `env.ts`. */
    envHeader?: string;
    /** A raw (verbatim) header replacing the generated one in the `.d.ts`. */
    dtsHeader?: string;
    /** The doc comment above the `process.env` interface. */
    envComment?: string;
    /** Add a `declare module 'vite'` augmentation to the `.d.ts`. */
    augmentVite?: boolean;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectOptions['envPathOf'];
}

/** Config type generation options. */
export interface GenerateTypesOptions extends GenerateBaseOptions, Pick<ConfigEngineOptions, 'baseGroup'> {
    /** Output directory. `false` (or omitted) disables writing. */
    outputDir?: string | false;
    /**
     * Per-scope main interface name.
     * @default "<PascalScope>Config"
     */
    interfaceNames?: Record<string, string>;
    /** Per-scope extra aliases appended after the generated interface. */
    aliases?: Record<string, string>;
    /**
     * Per-scope hand-written overrides: the full declaration text emitted
     * verbatim instead of a generated interface. Keyed by type name.
     */
    overrides?: Record<string, string>;
    /**
     * Import lines emitted once at the top of the file (after the header) so a
     * hand-written override can reference an imported type.
     */
    imports?: string[];
    /** File extension for generated files. @default "ts" */
    extension?: string;
    /** A raw (verbatim) header prepended to every generated file. */
    header?: string;
    /** Emit `@required` JSDoc tags. @default true */
    includeRequired?: boolean;
    /** Emit `@deprecated` JSDoc tags. @default true */
    includeDeprecated?: boolean;
    /** Emit `@example` JSDoc tags. @default true */
    includeExamples?: boolean;
    /** Emit `@since` JSDoc tags. @default true */
    includeSince?: boolean;
    /** Emit `@see` JSDoc tags. @default true */
    includeSee?: boolean;
    /** Emit `@remarks` JSDoc tags. @default true */
    includeRemarks?: boolean;
    /** Emit `@experimental` JSDoc tags. @default true */
    includeExperimental?: boolean;
    /** Emit `@alpha` JSDoc tags. @default true */
    includeAlpha?: boolean;
    /** Emit `@beta` JSDoc tags. @default true */
    includeBeta?: boolean;
    /** Show the env var equivalent in JSDoc. @default true */
    includeEnv?: boolean;
    /** Show the CLI flag equivalent in JSDoc. @default true */
    includeCli?: boolean;
}

/** Frontmatter callback context. */
export interface RenderMarkdownFrontmatter {
    options: Omit<GenerateMarkdownOptions, 'onContent'>;
}

/** Markdown reference generation options (shared by per-scope and combined renders). */
export interface RenderMarkdownOptions extends GenerateBaseOptions, Pick<ConfigEngineOptions, 'baseGroup'> {
    /** Output directory. `false` (or omitted) disables writing. */
    outputDir?: string | false;
    /** Frontmatter toggle, raw body, or callback. @default true */
    frontmatter?: boolean | string | ((ctx: RenderMarkdownFrontmatter) => string);
    /** Render every scope into one file instead of one file per scope. @default false */
    combined?: boolean;
    /** Show env var equivalents. @default true */
    includeEnv?: boolean;
    /** Show CLI flag equivalents. @default true */
    includeCli?: boolean;
    /** Page outline. @default [2, 3, 4] */
    outline?: number[];
    /** The scope whose env vars render as CLI flags. @default "cli" */
    cliScope?: string;
    /** Env-var prefix. @default "APP_" */
    envPrefix?: string;
    /** Label overrides for the index page. */
    labels?: { required?: string; core?: string; title?: string };
    /** A raw intro paragraph for the index page (replaces the default one). */
    intro?: string;
    /** A note shown above the required table. @default the standard sentence */
    requiredNote?: string;
    /** A note shown above the core table. @default the standard sentence */
    coreNote?: string;
    /** A "References" list appended to the index page. */
    references?: { label: string; href: string }[];
    /** Shorthand flags keyed by env var name (for the CLI scope). */
    shortFlags?: Record<string, string>;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectOptions['envPathOf'];
    /** Emit `- **Required**` lines. @default true */
    includeRequired?: boolean;
    /** Emit `- **Deprecated**` lines. @default true */
    includeDeprecated?: boolean;
    /** Emit `**Example(s):**` blocks. @default true */
    includeExamples?: boolean;
    /** Emit `- **Since**` lines. @default true */
    includeSince?: boolean;
    /** Emit `- **See**` lines. @default true */
    includeSee?: boolean;
    /** Emit `**Remarks:**` blocks. @default true */
    includeRemarks?: boolean;
    /** Emit `- **Experimental**` lines. @default true */
    includeExperimental?: boolean;
    /** Emit `- **Alpha**` lines. @default true */
    includeAlpha?: boolean;
    /** Emit `- **Beta**` lines. @default true */
    includeBeta?: boolean;
}

/** Config markdown generation options. */
export interface GenerateMarkdownOptions extends RenderMarkdownOptions {
    /** Document title. @default "Configuration" */
    title?: string;
    /** Index file name. @default "index.md" */
    indexFilename?: string;
}

/** A single generated markdown page. */
export interface GenerateMarkdownFileOptions extends GenerateBaseOptions {
    /** Page title (frontmatter and `#` heading). */
    title: string;
    /** Frontmatter outline levels. @default [2, 3] */
    outline?: number[];
    /** Page body, rendered below the title. */
    body: string;
}

/** Environment-variable reference page options. */
export interface GenerateEnvMarkdownOptions extends GenerateBaseOptions {
    /** Page title. @default "Environment variables" */
    title?: string;
    /** Frontmatter outline levels. @default [2, 3] */
    outline?: number[];
    /** Intro markdown rendered below the title. */
    intro?: string;
    /** Env-var prefix. @default "APP_" */
    envPrefix?: string;
}

/** A config-file reference page (no env-var language). */
export interface RenderConfigFileOptions {
    /** Document title. @default "Configuration" */
    title?: string;
    /** Intro paragraph under the title. */
    intro?: string;
    /** Page outline. @default [2, 3, 4] */
    outline?: number[];
    /** Emit `- **Required**` lines. @default true */
    includeRequired?: boolean;
    /** Emit `- **Deprecated**` lines. @default true */
    includeDeprecated?: boolean;
    /** Emit `**Example(s):**` blocks. @default true */
    includeExamples?: boolean;
    /** Emit `- **Since**` lines. @default true */
    includeSince?: boolean;
    /** Emit `- **See**` lines. @default true */
    includeSee?: boolean;
    /** Emit `**Remarks:**` blocks. @default true */
    includeRemarks?: boolean;
    /** Emit `- **Experimental**` lines. @default true */
    includeExperimental?: boolean;
    /** Emit `- **Alpha**` lines. @default true */
    includeAlpha?: boolean;
    /** Emit `- **Beta**` lines. @default true */
    includeBeta?: boolean;
}

/** JSON Schema generation options. */
export interface GenerateJsonSchemaOptions extends GenerateBaseOptions, Pick<ConfigEngineOptions, 'baseGroup'> {
    /** Output file path. When omitted, nothing is written. */
    output?: string | false;
    /** Document metadata overrides. */
    id?: string;
    title?: string;
    description?: string;
    /**
     * Scopes the document requires.
     * @default [] (every config section is opt-in by presence)
     */
    requiredScopes?: string[];
    /**
     * Keep Zod's document-level `$ref`/`$defs` graph instead of inlining every
     * reference into its scope. The `$defs` tables are hoisted to the document
     * root so the references stay valid.
     * @default false
     */
    preserveDefs?: boolean;
    /** Descriptions for the generated scope properties, keyed by scope name. */
    scopeDescriptions?: Record<string, string>;
    /** Set the document root's `additionalProperties` constraint. */
    additionalProperties?: boolean;
}

/** CLI reference generation options. */
export interface GenerateCliDocsOptions extends GenerateBaseOptions {
    /** Page title. @default "CLI reference" */
    title?: string;
    /** Frontmatter outline levels. @default [2, 3] */
    outline?: number[];
    /** Intro markdown rendered before the command table. */
    intro?: string;
    /** Command prefix used in headings and links. @default "dbx" */
    prefix?: string;
}

export interface GenerateBaseOptions {
    /** Intercept the resolved content. */
    onContent?: (content: string) => string;
}

/** Generated output formatting options. */
export interface FormatGeneratedOptions {
    /** File name used to infer the language. @default "generated.ts" */
    fileName?: string;
    /** Extra Oxfmt options merged over {@link GENERATED_FORMAT_OPTIONS}. */
    options?: Record<string, unknown>;
}

/** A serialized env var entry in `config.json`. */
export interface ConfigJsonEntry {
    name: string;
    path: string;
    scope: string;
    description?: string;
    default?: unknown;
    required?: boolean;
    secret?: boolean;
    public?: boolean;
}

/** The generated config metadata document (`config.json`). */
export interface ConfigJsonDoc {
    $comment: string;
    version: number;
    env: ConfigJsonEntry[];
}

/** Config metadata JSON generation options. */
export interface BuildConfigJsonOptions {
    /** The env-var prefix. @default "APP_" */
    envPrefix?: string;
    /** Override the `$comment` banner. */
    comment?: string;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectOptions['envPathOf'];
}
