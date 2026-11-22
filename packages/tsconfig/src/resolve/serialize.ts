/** JSON-safe serialization for resolved aliases and configs. */

import type { ResolvedTsconfig, SerializedTsconfigAlias, TsconfigAlias } from '../types/index.js';

/**
 * Convert a resolved alias into JSON-safe form: a string `find` stays a string,
 * a `RegExp` becomes `{ source, flags }` so `JSON.stringify` (CLI `--json`, the
 * VS Code extension, MCP) keeps the pattern instead of emitting `{}`.
 */
export function serializeTsconfigAlias(alias: TsconfigAlias): SerializedTsconfigAlias {
    const { find, replacement } = alias;
    return typeof find === 'string'
        ? { find, replacement }
        : { find: { source: find.source, flags: find.flags }, replacement };
}

/** Rebuild a Vite-compatible alias from {@link serializeTsconfigAlias}'s output. */
export function deserializeTsconfigAlias(alias: SerializedTsconfigAlias): TsconfigAlias {
    const { find, replacement } = alias;
    return typeof find === 'string'
        ? { find, replacement }
        : { find: new RegExp(find.source, find.flags), replacement };
}

/** Convert a whole resolved tsconfig into JSON-safe form (aliases only differ). */
export function serializeResolvedTsconfig(
    resolved: ResolvedTsconfig
): Omit<ResolvedTsconfig, 'alias'> & { alias: SerializedTsconfigAlias[] } {
    return { ...resolved, alias: resolved.alias.map(serializeTsconfigAlias) };
}
