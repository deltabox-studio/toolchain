import type { Replacements } from './template.js';
import type { ProjectType, SyncTask, ToolchainConfig } from './toolchain.js';

/** A value that may or may not be awaited. */
export type Awaitable<T> = T | Promise<T>;

/** A file that was written by a generator: an absolute path plus its content. */
export interface GeneratedFile {
    path: string;
    content: string;
}

/** Any JSON-serializable value. */
export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

/** A CLI option a tooling command exposes (framework-agnostic). */
export interface ToolchainOption {
    /** Commander-style flags, eg. `-o, --out <path>`. */
    flags: string;
    /** Human-readable description. */
    description: string;
    /** Optional default value (stringified). */
    default?: string;
}

/**
 * The context handed to every command after the consumer's
 * `dbx.config.*` has been loaded, so a command can derive its defaults
 * from the config; explicit CLI flags override those defaults.
 */
export interface ToolchainCommandContext {
    /** The project root the config was loaded from. */
    cwd: string;
    /** The detected/configured project kind. */
    projectType: ProjectType;
    /** The loaded tooling config (empty object when none was found). */
    config: ToolchainConfig;
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** The config file that was loaded, if any. */
    configPath?: string;
    /**
     * The managed-file sync tasks `dbx sync` runs. Supplied by the CLI (which
     * aggregates the packages) so a package command such as `migrate` can
     * regenerate managed files without depending on every sync package. Absent
     * when a command is driven programmatically.
     */
    syncTasks?: SyncTask[];
}

/** A positional argument a command accepts. */
export interface ToolchainArgument {
    /** The argument name (also its key in the run `args` object). */
    name: string;
    /** Human-readable description. */
    description: string;
    /** Accept one value (default) or many (variadic, collected into an array). */
    variadic?: boolean;
    /** Whether the argument is required (default true). */
    required?: boolean;
}

/**
 * A framework-agnostic command description. Packages export these (eg.
 * `configCommands()`) and the root `dbx` CLI registers them with
 * commander, so packages never depend on a CLI framework. `args` contains only
 * the flags explicitly passed on the command line (so config defaults apply
 * otherwise); `context` carries the loaded config.
 */
export interface ToolchainCommand<Args extends Record<string, unknown> = Record<string, unknown>> {
    /** The command name, eg. `config` or `generate`. */
    name: string;
    /** Human-readable description. */
    description: string;
    /** Positional arguments the command accepts. */
    args?: ToolchainArgument[];
    /** Options the command accepts. */
    options?: ToolchainOption[];
    /**
     * Forward every operand (including unknown flags) to the command instead of
     * parsing them. Used by provider passthrough commands (eg. `vite:dev`), which
     * hand their raw argv to the wrapped binary. The raw operands arrive under
     * the `args` key of the run argument (typed `string[]`).
     */
    passthrough?: boolean;
    /** Run the command with the CLI-provided options + the loaded config. */
    run: (args: Args, context: ToolchainCommandContext) => Awaitable<void>;
}

/** A package.json-shaped object (loose; only the fields the tooling touches). */
export interface PackageJson {
    name?: string;
    version?: string;
    private?: boolean;
    type?: string;
    description?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    workspaces?: string[] | { packages?: string[] };
    exports?: Record<string, unknown> | string;
    files?: string[];
    [key: string]: unknown;
}
