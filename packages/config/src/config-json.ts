/**
 * Config metadata JSON generation (`config.json`), consumed by docs/other
 * tooling to list every available configuration variable.
 */

import { type CollectEnvVarsOptions, collectEnvVars } from './collect.js';
import type { ConfigScopes } from './types.js';

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

export interface BuildConfigJsonOptions {
    /** The env-var prefix (default `APP_`). */
    envPrefix?: string;
    /** Override the `$comment` banner. */
    comment?: string;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectEnvVarsOptions['envPathOf'];
}

/** Build the config metadata JSON document. */
export function buildConfigJson(
    scopes: ConfigScopes,
    options: BuildConfigJsonOptions = {}
): ConfigJsonDoc {
    const vars = collectEnvVars(scopes, options.envPrefix, { envPathOf: options.envPathOf });
    return {
        $comment:
            options.comment ??
            'Generated from the config engine — edit the config schemas instead.',
        version: 1,
        env: vars.map(def => ({
            name: def.name,
            path: def.path,
            scope: def.scope,
            ...(def.description ? { description: def.description } : {}),
            ...(def.default !== undefined ? { default: def.default } : {}),
            ...(def.required ? { required: true } : {}),
            ...(def.secret ? { secret: true } : {}),
            ...(def.public ? { public: true } : {}),
        })),
    };
}
