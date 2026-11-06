# Generated outputs

Every generator reads from the same Zod or untyped schema. The engine's own config model
is the living example: its types are committed at
[packages/shared/src/config-types.ts](https://github.com/deltabox-studio/toolchain/blob/main/packages/shared/src/config-types.ts).

For the engine/standalone call forms and the full option list per generator, see
[Generate](/guide/config-generator/generate).

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

An object schema that also accepts arbitrary keys (Zod `.catchall(...)`,
`.loose()` or `z.looseObject(...)`, ie. `additionalProperties` in the JSON
Schema) generates an open interface with an index signature, so the extra keys
stay typed as `unknown` instead of being rejected:

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

Markdown frontmatter is enabled by default. Set `frontmatter: false` to omit it,
pass a raw string to replace the body, or pass a callback to build it from the
generator options. The returned string is wrapped in `---` automatically.

```ts
generateConfigMarkdown(schema, {
    frontmatter: ctx => `title: ${ctx.options.title ?? 'Configuration'}`,
});
```

Use `combined: true` to render every scope into one file instead of one file per
scope. `generateConfigTypes`, `generateConfigMarkdown` and `generateConfigEnv`
return file contents and only write when `outputDir`/`output` is a string;
`false` explicitly disables writing.

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

## CLI docs — `generateCliDocs()`

`generateCliDocs` is the one generator that does not read the config schema: it
renders a markdown reference from `ToolchainCommand` descriptors. Pass the command
list your CLI actually registers, including custom descriptors:

```ts
import { builtinCommands } from '@deltabox/toolchain/cli';
import { generateCliDocs } from '@deltabox/toolchain/config';

const markdown = generateCliDocs([...builtinCommands(), ...myCommands], {
    prefix: 'my-cli',
    title: 'CLI reference',
    intro: 'Generated from the registered commands.',
});
```

Hidden commands are omitted and duplicate names keep the first descriptor. The
`dbx` reference itself is generated this way, so a custom command no longer has
to be added to `builtinCommands()` to be documented.

## Post-processing

The `generate*` functions return their content, so you can transform it before
writing (the `write*` methods write immediately):

```ts
const files = generateConfigTypes(schema);
for (const [scope, source] of Object.entries(files)) {
    const sourceWithBanner = `// Generated — do not edit.\n${source}`;
    await fs.promises.writeFile(`types/${scope}.ts`, sourceWithBanner);
}
```

If the transform changes the formatting, run the result through
[`formatGenerated()`](#formatting--formatgenerated) before writing.

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
