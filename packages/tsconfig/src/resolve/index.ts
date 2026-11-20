/** Public barrel for tsconfig reading, extending, flattening and resolution. */

export { flattenRemoteTsconfig } from './flatten.js';
export { parseTsconfig, readTsconfig } from './read.js';
export {
    assertTsconfigChain,
    assertTsconfigChainAsync,
    prefetchTsconfigExtends,
} from './remote.js';
export {
    resolveTsconfig,
    resolveTsconfigAsync,
    resolveTsconfigCompilerOption,
    resolveTsconfigConfig,
    resolveTsconfigFilePatterns,
} from './resolve.js';
export {
    deserializeTsconfigAlias,
    serializeResolvedTsconfig,
    serializeTsconfigAlias,
} from './serialize.js';
export type { FlattenRemoteTsconfigOptions, TsconfigContents } from './types.js';
