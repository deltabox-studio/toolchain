/** Internal and public types for tsconfig reading and resolution. */

import type { TsconfigJson } from '../types/index.js';

/** A config in an `extends` chain plus its resolved location. */
export interface LoadedTsconfig {
    file: string;
    dir: string;
    config: TsconfigJson;
}

/** In-memory config contents (absolute path -> JSONC text) for a resolution pass. */
export type TsconfigContents = ReadonlyMap<string, string> | Record<string, string>;

/** Options for {@link flattenRemoteTsconfig}. */
export interface FlattenRemoteTsconfigOptions {
    /** Directory the flattened paths should be relative to (default: the config's directory). */
    outDir?: string;
    /** In-memory contents (absolute path -> text) for local configs. */
    contents?: TsconfigContents;
}
