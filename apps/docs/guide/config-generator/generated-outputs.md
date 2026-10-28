# Generated outputs

Every generator writes from the same Zod schema. The engine's own config model
is the living example: its types are committed at
[packages/shared/src/config-types.ts](https://github.com/deltabox-studio/toolchain/blob/main/packages/shared/src/config-types.ts).

## Config types — `generateConfigTypes()` / `writeConfigTypes()`

Named `interface`s (and `type` aliases for enums/unions) with jsdoc taken from
`.describe()`. Unions and refs stay named, so nested objects are referenced
rather than inlined:

```ts
// engine.generateConfigTypes() -> { server: "...", cli: "..." }
engine.writeConfigTypes({ outputDir: 'types' }); // types/server.ts, types/cli.ts
```

```ts
// types/server.ts
export interface ServerConfig {
    /** Bind host. */
    host?: string;
    port?: number;
    auth?: { password?: string; enabled?: boolean };
}
```

An object schema that also accepts arbitrary keys (Zod `.catchall(...)` /
`.passthrough()`, ie. `additionalProperties` in the JSON Schema) generates an
open interface with an index signature, so the extra keys stay typed as
`unknown` instead of being rejected:

```ts
export interface ServerConfig {
    /** Bind host. */
    host?: string;
    [key: string]: unknown;
}
```

## Markdown — `writeMarkdown()`

One reference page per scope plus an index listing the required/core env vars:

```ts
engine.writeMarkdown({ outputDir: 'docs/reference/configuration' });
// docs/reference/configuration/server.md, .../index.md
```

See a real full example at [config/reference.md](../../config/reference.md).

## Env — `renderEnvFile()` / `writeEnvFile()`

A `.env.example`; secrets are emitted commented out so operators fill them in:

```sh
engine.writeEnvFile({ output: '.env.example' });

# ---- SERVER ----
MYAPP_HOST=localhost
# MYAPP_AUTH_PASSWORD=
```

## JSON Schema — `generateJsonSchema()` / `writeJsonSchema()`

The resolved untyped JSON Schema for every scope, for editor autocomplete:

```ts
await engine.writeJsonSchema({ output: 'config.schema.json' });
```

## Formatting — `formatGenerated()`

Generated text is formatted **at generation time**, so a written file is already
formatted instead of relying on a separate `yarn format` pass. `formatGenerated`
runs source through Oxfmt, preferring the project-local `vite-plus/fmt` (Oxfmt
ships with Vite+), then `oxfmt`, and returns the input untouched when no formatter
is resolvable, so generation never fails on a missing formatter.

```ts
import { formatGenerated, GENERATED_FORMAT_OPTIONS } from '@deltabox/toolchain/config';

const source = 'export const config={a:1}';
const formatted = await formatGenerated(source, {
    fileName: 'config.ts', // infers the language (default `generated.ts`)
    options: { printWidth: 100 }, // merged over GENERATED_FORMAT_OPTIONS
});
```

`GENERATED_FORMAT_OPTIONS` is the baseline Oxfmt config matching the toolchain's
own `vite.config.ts` (4-space indent, single quotes, `trailingComma: 'es5'`,
`jsdoc: true`, ...). Pass `options.fileName` to format JSON, markdown or another
language, and `options.options` to override any single option.

For a full, real example of the generated config types, see
`packages/shared/src/config-types.ts`.
