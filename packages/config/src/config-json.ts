/**
 * Config metadata JSON generation (`config.json`), consumed by docs/other
 * tooling to list every available configuration variable.
 */

import { collectDefinitions, DEFAULT_ENV_PREFIX } from './collect.js';
import { envNameOf, isEnvVariable } from './generators/env-file.js';
import type { BuildConfigJsonOptions, ConfigJsonDoc, ConfigSchema } from './types/index.js';

/** Build the config metadata JSON document. */
export function buildConfigJson(
    schema: ConfigSchema,
    options: BuildConfigJsonOptions = {}
): ConfigJsonDoc {
    const envPrefix = options.envPrefix ?? DEFAULT_ENV_PREFIX;
    const vars = collectDefinitions(schema, {
        envPrefix,
        envPathOf: options.envPathOf,
    }).filter(isEnvVariable);
    return {
        $comment:
            options.comment ??
            'Generated from the config engine — edit the config schemas instead.',
        version: 1,
        env: vars.map(def => ({
            name: envNameOf(def, envPrefix),
            path: def.path,
            scope: def.scope,
            ...(def.description ? { description: def.description } : {}),
            ...(def.default !== undefined && !def.secret ? { default: def.default } : {}),
            ...(def.required ? { required: true } : {}),
            ...(def.secret ? { secret: true } : {}),
            ...(def.public ? { public: true } : {}),
        })),
    };
}
