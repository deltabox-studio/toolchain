# Generated outputs

Every generator reads from the same Zod, untyped or plain-value schema. The
engine's own config model is the living example: its types are committed at
[packages/shared/src/config-types.ts](https://github.com/deltabox-studio/toolchain/blob/main/packages/shared/src/config-types.ts).

For the engine/standalone call forms and the full option list per generator, see
[Generate](/guide/config-generator/generate). For every export and option, see
the [API reference](/guide/config-generator/api).

## Config types — `engine.types` / `generateConfigTypes()`

Named `interface`s (and `type` aliases for enums/unions) with jsdoc taken from
`.describe()`. Unions and refs stay named, so nested objects are referenced
rather than inlined:

```ts
// engine.types.generate() -> { server: "...", cli: "..." }
engine.types.write({ outputDir: 'types' }); // types/server.ts, types/cli.ts
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

## Markdown — `engine.markdown` / `generateConfigMarkdown()`

One reference page per scope plus an index listing the required/core env vars:

```ts
engine.markdown.write({ outputDir: 'docs/reference/configuration' });
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

## Env — `engine.env` / `generateEnvFile()`

A `.env.example`; secrets are emitted commented out so operators fill them in:

```ts
engine.env.write({ output: '.env.example' });
```

```sh
# ---- SERVER ----
MYAPP_HOST=localhost
# MYAPP_AUTH_PASSWORD=
```

## JSON Schema — `engine.jsonSchema` / `generateConfigJsonSchema()`

The resolved untyped JSON Schema for every scope, for editor autocomplete:

```ts
await engine.jsonSchema.write({ output: 'config.schema.json' });
```

## CLI docs - `engine.markdown.cli` / `generateCliDocs()`

`generateCliDocs` reads `CliCommand` descriptors rather than the config
schema: it renders a markdown reference from the commands your CLI actually
registers. The engine exposes the same generator as
`engine.markdown.cli.generate()` (and `.write()`):

```ts
import { builtinCommands } from '@deltabox/toolchain/cli';

const markdown = engine.markdown.cli.generate([...builtinCommands(), ...myCommands], {
    prefix: 'my-cli',
    title: 'CLI reference',
    intro: 'Generated from the registered commands.',
});

engine.markdown.cli.write(builtinCommands(), { output: 'docs/cli.md' });
```

The standalone `generateCliDocs(commands, options)` export is equivalent when you
do not already have an engine. Hidden commands are omitted and duplicate names
keep the first descriptor. The `dbx` reference itself is generated this way, so a
custom command no longer has to be added to `builtinCommands()` to be documented.

## Env docs - `engine.markdown.env` / `generateEnvMarkdown()`

`engine.markdown.env.generate()` renders the environment-variable table from
`engine.collect()`, using the engine's `envPrefix`. `write({ output })` writes the
page:

```ts
engine.markdown.env.write({ output: 'docs/env.md' });
```

## Single pages - `engine.markdown.file` / `generateMarkdownFile()`

`engine.markdown.file` renders one page with frontmatter and a `#` title. The
body is supplied by the caller, so it is useful for overview/index pages:

```ts
engine.markdown.file.write({
    output: 'docs/index.md',
    title: 'Config types',
    body: 'The toolchain has three configuration surfaces...',
});
```

## Post-processing

The `generate*` functions return their content, so you can transform it before
writing (the grouped `.write()` methods write immediately):

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
formatted instead of relying on a separate `yarn fmt` pass. `formatGenerated`
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
