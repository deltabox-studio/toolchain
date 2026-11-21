# Generate

Every generator has two forms:

- **Bound engine** — `engine.types.generate()` injects the engine's
  `envPrefix`, `baseGroup`, `root` and `envPathOf`.
- **Standalone** — `generateConfigTypes(schema, options)` takes those options
  explicitly, for one-off scripts and tests.

The grouped `.write` methods write to disk and return the written paths. The
grouped `.generate` methods return the content and only write when you pass `outputDir`/`output`
(a string); `false` disables writing.

## At a glance

| Output         | Engine                                                       | Standalone                                                |
| -------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| `.env.example` | `engine.env.generate()` / `engine.env.write()`               | `generateEnvFile()`                                       |
| Env types      | `engine.env.types.generate()` / `engine.env.types.write()`   | `generateConfigEnv()`                                     |
| Config types   | `engine.types.generate()` / `engine.types.write()`           | `generateConfigTypes()`                                   |
| Markdown       | `engine.markdown.generate()` / `engine.markdown.write()`     | `generateConfigMarkdown()`                                |
| JSON Schema    | `engine.jsonSchema.generate()` / `engine.jsonSchema.write()` | `generateConfigJsonSchema()` / `generateJsonSchemaFile()` |
| Metadata JSON  | `engine.configJson.build()`                                  | `buildConfigJson()`                                       |
| CLI options    | `engine.cli.generate()` / `engine.cli.write()`               | `generateCliOptions()`                                    |
| Scoped CLI     | `engine.cli.options()`                                       | `generateConfigCliOptions()` / `configCliCommand()`       |
| Program        | `engine.cli.program.create()`                                | `generateConfigProgram()`                                 |
| CLI docs       | `engine.markdown.cli.generate()` / `.write()`                | `generateCliDocs()`                                       |
| Env docs       | `engine.markdown.env.generate()` / `.write()`                | `generateEnvMarkdown()`                                   |
| Markdown page  | `engine.markdown.file.generate()` / `.write()`               | `generateMarkdownFile()`                                  |
| Formatting     | —                                                            | `formatGenerated()`                                       |

## Env file — `.env.example`

```ts
engine.env.write({ output: '.env.example' });
```

Standalone, with the common options:

```ts
import { generateEnvFile } from '@deltabox/toolchain/config';

const content = generateEnvFile(schema, {
    envPrefix: 'MYAPP_',
    header: 'Copy to .env and fill the blanks.',
    scopes: ['server', 'cli'],
    exclude: ['MYAPP_INTERNAL_TOKEN'],
    values: { MYAPP_PORT: '8080' },
    extra: { MYAPP_FEATURE_FLAG: 'true' },
});
```

Options: `include`/`exclude` (env names), `values` (default overrides),
`scopes`, `bare`, `extra` (raw `NAME=value` lines), `header`, `scopeSeparator`.
Secrets are emitted commented out.

## Env types — `env.ts` + `dbx-env.d.ts`

```ts
engine.env.types.write({ outputDir: 'types' }); // types/env.ts, types/dbx-env.d.ts
```

```ts
import { generateConfigEnv } from '@deltabox/toolchain/config';

const files = generateConfigEnv(schema, {
    envPrefix: 'MYAPP_',
    outputDir: 'types',
    envInterfaceName: 'AppEnv',
    viteEnvInterfaceName: 'AppViteEnv',
    importPath: './env.js',
    augmentVite: true,
    envComment: 'Runtime configuration.',
});
// files: { 'env.ts': '...', 'dbx-env.d.ts': '...' }
```

Options: `envFile`/`dtsFile` (file names), `header`, `envHeader`, `dtsHeader`,
`augmentVite` (a `declare module 'vite'` augmentation).

## Config types

```ts
engine.types.write({ outputDir: 'types' });
```

Standalone, with hand-written overrides and aliases:

```ts
import { generateConfigTypes } from '@deltabox/toolchain/config';

const files = generateConfigTypes(schema, {
    baseGroup: 'base',
    outputDir: 'types',
    interfaceNames: { server: 'ServerConfig' },
    aliases: { server: 'export type ServerOptions = ServerConfig;' },
    imports: ["import type { FastifyServerOptions } from 'fastify';"],
    overrides: {
        ServerConfig: `export interface ServerConfig {
    host?: string;
    port?: number;
}`,
    },
    header: '// Generated — do not edit.',
    extension: 'ts',
    includeEnv: false,
});
```

Options: `interfaceNames` (per scope), `aliases` (per scope, appended),
`overrides` (full declaration text, keyed by type name), `imports` (emitted once
at the top), `extension`, `header`, and the `include*` annotation flags.
`baseGroup` accepts a string or an array of strings; multiple groups are merged
into the generated `...Base` interface in declaration order.

## Markdown

```ts
engine.markdown.write({ outputDir: 'docs/reference/configuration' });
```

```ts
import { generateConfigMarkdown } from '@deltabox/toolchain/config';

const files = generateConfigMarkdown(schema, {
    baseGroup: 'base',
    envPrefix: 'MYAPP_',
    outputDir: 'docs/reference/configuration',
    title: 'Configuration',
    frontmatter: ctx => `title: ${ctx.options.title ?? 'Configuration'}`,
    combined: true, // one index.md instead of one file per scope
    includeEnv: false,
});
```

`frontmatter: false` omits the frontmatter, a string replaces the body, and a
callback builds it from the generator options. `combined: true` renders every
scope into one file. `cliScope`, `shortFlags` and `references` control the CLI
equivalents and footer links.

## JSON Schema

```ts
const doc = await engine.jsonSchema.generate();
await engine.jsonSchema.write({ output: 'config.schema.json' });
```

```ts
import { generateConfigJsonSchema, generateJsonSchemaFile } from '@deltabox/toolchain/config';

const doc = await generateConfigJsonSchema(schema, {
    baseGroup: 'base',
    id: 'https://acme.dev/schemas/config.json',
    title: 'Acme configuration',
    description: 'Every env-backed setting.',
});
const path = await generateJsonSchemaFile(schema, { output: 'config.schema.json' });
```

Both functions are async. `generateConfigJsonSchema` returns the document;
`generateJsonSchemaFile` writes it and returns the path.

`preserveDefs: true` keeps Zod's document-level `$ref`/`$defs` graph instead of
inlining every scope (the `$defs` tables are hoisted to the document root).
`scopeDescriptions` adds a description to a generated scope property, and
`additionalProperties` sets the root constraint:

```ts
const doc = await engine.jsonSchema.generate({
    preserveDefs: true,
    additionalProperties: false,
    scopeDescriptions: { server: 'Server settings.' },
});
```

## Config metadata JSON

```ts
const metadata = engine.configJson.build();
fs.writeFileSync('config.json', `${JSON.stringify(metadata, null, 4)}\n`);
```

```ts
import { buildConfigJson } from '@deltabox/toolchain/config';

const metadata = buildConfigJson(schema, {
    envPrefix: 'MYAPP_',
    comment: 'Generated from the config schemas.',
});
```

The document contains `$comment`, `version`, and `env[]` entries with the name,
path, scope, description, default, `required`, `secret` and `public` flags.
Secrets never include a default.

## CLI options

```ts
const defs = engine.cli.generate({ scope: 'cli' });
```

```ts
import { createCliArgsParser, generateCliOptions } from '@deltabox/toolchain/config';

const defs = generateCliOptions(schema, {
    envPrefix: 'MYAPP_',
    scope: 'cli',
    output: 'cli-options.json',
});
const parser = createCliArgsParser(defs);
parser.parse(['--base-url', 'http://localhost:8080']);
```

Options: `scope` (default `cli`), `output`, `shortFlags`, `envPathOf`.

## CLI program

The preferred entry point is `engine.cli.program.create()`. It derives options
from the engine schema, infers `run` values and accepts the full program options:

```ts
const program = engine.cli.program.create(
    cmd => [
        cmd('serve')
            .description('Run the server.')
            .option({ flags: '--json', description: 'Print JSON.' })
            .run(({ config, values, context }) => {
                // config: the validated `serve` section
                // values: the explicit CLI values
                // context: the host command context
            }),
    ],
    {
        name: 'acme',
        globalOptions: [{ flags: '--json', description: 'Print JSON.' }],
        disableColors: ({ color }) => color === false,
    }
);
await program.invokeAsync();
```

`engine.cli.program.create()` accepts `argv`, `name`, `description`, `version`,
`globalOptions`, `context`, `disableColors`, `writeOut`, `writeErr` and
`format`. See the
[API reference](/guide/config-generator/api#program-members-and-options)
for `invoke`/`invokeAsync`, hooks, help/error formatting and `bin`.

Without an engine, `generateConfigProgram(schema, options)` returns the same
`CliCommand[]`; each command spec runs with the validated scope config. It
requires `envPrefix`; `envPathOf`, `commands`, `includePaths`, `excludePaths`,
`flags`, `descriptions` and `types` shape the generated commands. When `commands`
is omitted, one command is generated per command-eligible scope
(`cliCommand: false` opts a scope out).

```ts
import { generateConfigProgram } from '@deltabox/toolchain/config';

const commands = generateConfigProgram(schema, {
    envPrefix: 'MYAPP_',
    includePaths: ['server', 'server.port'],
});
```

Use the lower-level `createConfigProgram(commands, options?)` only when you
already have a command list that is not tied to an engine; it accepts the same
program options.

## CLI docs

`generateCliDocs(commands, options?)` renders a markdown reference from
`CliCommand` descriptors. It is standalone because it does not read a
config schema:

```ts
import { builtinCommands } from '@deltabox/toolchain/cli';
import { generateCliDocs } from '@deltabox/toolchain/config';

const markdown = generateCliDocs([...builtinCommands(), ...myCommands], {
    title: 'CLI reference',
    intro: 'Generated from the registered commands.',
    prefix: 'my-cli',
    outline: [2, 3],
});
```

Hidden commands are omitted, duplicate names keep the first descriptor, and
args/options/defaults are rendered like the `dbx` reference. Pass the result
through `formatGenerated(..., { fileName: 'cli.md' })` to format it.

## Formatting

```ts
import { formatGenerated } from '@deltabox/toolchain/config';

const formatted = await formatGenerated(source, {
    fileName: 'config.ts', // infers the language
    options: { printWidth: 100 }, // merged over GENERATED_FORMAT_OPTIONS
});
```

`formatGenerated` is best-effort: it returns the input unchanged when no
formatter is available.

## Advanced

### Post-process generated output

Generators return strings or records, so you can transform them before writing:

```ts
import fs from 'node:fs';

import { formatGenerated, generateConfigTypes } from '@deltabox/toolchain/config';

const files = generateConfigTypes(schema, { baseGroup: 'base' });
for (const [scope, source] of Object.entries(files)) {
    const withBanner = `// Generated from schemas/${scope}.ts — do not edit.\n${source}`;
    const formatted = await formatGenerated(withBanner, { fileName: `${scope}.ts` });
    fs.mkdirSync('types', { recursive: true });
    fs.writeFileSync(`types/${scope}.ts`, formatted);
}
```

### Custom headers, imports and overrides

```ts
generateConfigTypes(schema, {
    header: '/* eslint-disable */',
    imports: ["import type { AppEnv } from './env.js';"],
    overrides: {
        ServerConfig: 'export interface ServerConfig extends BaseServer {}',
    },
});
```

`overrides` is keyed by the generated type name and replaces the whole
declaration, so keep the `imports`/`header` options handy for types the schema
cannot express.

### Dry runs

Every generator accepts `outputDir: false` / `output: false`:

```ts
generateConfigTypes(schema, { outputDir: false });
await generateConfigJsonSchema(schema, { output: false });
```

The grouped `.write()` methods always write; use the `.generate()` methods when
you only need the content.

### Engine vs standalone

The engine form injects the bound options; the standalone form takes them
explicitly. They produce the same output:

```ts
const engine = createConfigEngine({
    schema,
    envPrefix: 'MYAPP_',
    baseGroup: 'base',
});

engine.markdown.generate(); // uses the bound options

generateConfigMarkdown(schema, {
    envPrefix: 'MYAPP_',
    baseGroup: 'base',
});
```

See [Generated outputs](/guide/config-generator/generated-outputs) for the shape
of each file, [CLI commands](/guide/config-generator/cli-commands) for the
`config:*` descriptors, and the [API reference](/guide/config-generator/api) for
the complete export list.
