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
    | { [key: string & {}]: JsonValue };

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
    [key: string & {}]: unknown;
}
