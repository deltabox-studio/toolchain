# API reference

Everything is exported from the `@deltabox/toolchain/config` subpath. The engine
and the standalone functions share the same schemas and options, so you can start
with the engine and drop to a single generator when you only need one artifact.

```ts
import {
    createConfigEngine,
    generateConfigTypes,
    parseConfig,
    parseEnvConfig,
    loadConfigAsync,
} from '@deltabox/toolchain/config';
```

## Schemas

A schema is a Zod schema, a resolved untyped schema, or a plain value. Plain
objects and primitives are supported through their defaults.

```ts
import { z } from 'zod';

// Zod (the richest form: validation + defaults + metadata)
const zodSchema = z.object({
    port: z.number().default(3000).meta({ envName: 'MYAPP_PORT' }),
});

// Untyped/JSON-Schema shape
const untypedSchema = {
    type: 'object',
    properties: {
        port: { type: 'number', default: 3000, envName: 'MYAPP_PORT' },
        host: { type: 'string', default: 'localhost' },
    },
};

// Plain object (values become defaults)
const plainObject = {
    port: 3000,
    host: 'localhost',
};

// A primitive scope (the value becomes the default)
const plainPrimitive = 3000;
```

A **scope map** keys each top-level entry by scope name:

```ts
const scopes = {
    server: zodSchema,
    frontend: { apiUrl: 'http://localhost:8080' },
    cli: 3000,
};
```

A single schema (Zod or untyped) is treated as one runtime scope named `config`.
Arrays of schemas are merged into one scope.

```ts
const engine = createConfigEngine({ schema: scopes, baseGroup: ['base', 'server'] });
```

The `baseGroup` option accepts a string or an array of strings. Each named group
is hoisted into the generated `...Base` interface (types) and the flattened
markdown/JSON Schema shape. Multiple groups are merged in declaration order.

## Engine

`createConfigEngine(options)` binds the schema once and exposes the generators.

```ts
const engine = createConfigEngine({
    schema: scopes,
    envPrefix: 'MYAPP_',
    baseGroup: ['base', 'server'],
    root: process.cwd(),
    envPathOf: env =>
        env
            .replace(/^MYAPP_/, '')
            .toLowerCase()
            .replace(/_/g, '.'),
});

engine.schema; // the exact schema passed in
engine.envPrefix; // 'MYAPP_'
engine.baseGroup; // ['base', 'server']
engine.root; // process.cwd()
```

| Member                  | Returns                                        |
| ----------------------- | ---------------------------------------------- |
| `engine.collect()`      | every collected `ConfigDef`                    |
| `engine.requiredVars()` | the `required` definitions (optionally scoped) |

### `engine.env`

```ts
const envFile = engine.env.generate({ envPrefix: 'MYAPP_' });
// MYAPP_PORT=3000

const envTypes = engine.env.types.generate({ outputDir: 'types' });
// { 'env.ts': '...', 'dbx-env.d.ts': '...' }

engine.env.write({ output: '.env.example' });
engine.env.types.write({ outputDir: 'types' }); // returns the written paths
```

### `engine.types`

```ts
const files = engine.types.generate({ outputDir: 'types' });
// { server: 'export interface ServerConfig...', cli: '...' }

engine.types.write({ outputDir: 'types', extension: 'mts' });
```

### `engine.markdown`

```ts
const commands = [/* your ToolchainCommand descriptors */];

const pages = engine.markdown.generate({ outputDir: 'docs/reference' });
// { 'server.md': '...', 'cli.md': '...', 'index.md': '...' }

// One combined page instead of one per scope
engine.markdown.generate({ combined: true }); // { 'index.md': '...' }

// A CLI command reference
engine.markdown.cli.generate(commands);
engine.markdown.cli.write(commands, { output: 'docs/cli.md' });

// The environment-variable reference
engine.markdown.env.generate();
engine.markdown.env.write({ output: 'docs/env.md' });

// One generic page
engine.markdown.file.generate({ title: 'Docs', body: 'Hello.' });
```

### `engine.cli`

```ts
// Env-backed `cli` scope options
const options = engine.cli.generate({ scope: 'cli' });
// [{ flag: '--port', env: 'MYAPP_PORT', type: 'number', ... }]

engine.cli.write({ output: 'cli-options.json' });

// Scoped config commands + options from every config field
const scoped = engine.cli.options();
// {
//   command: { server: { name: 'server', type: 'object', options: [...] }, ... },
//   commandEntries: [['server', {...}], ...],
//   options: [...],
//   optionsEntries: [['--port', {...}], ...],
// }
```

### `engine.jsonSchema`

`jsonSchema` is async because Zod's JSON Schema lowering is async.

```ts
const doc = await engine.jsonSchema.generate({ preserveDefs: true });
await engine.jsonSchema.write({ output: 'config.schema.json' });
```

### `engine.configJson`

```ts
const metadata = engine.configJson.build();
// { env: [...], cli: [...], config: [...] }
```

## Standalone generators

Every engine method has a standalone equivalent. They return content unless you
pass an output path/directory.

```ts
import {
    collectDefinitions,
    formatGenerated,
    generateCliDocs,
    generateCliOptions,
    generateConfigEnv,
    generateConfigJsonSchema,
    generateConfigMarkdown,
    generateConfigTypes,
    generateEnvFile,
    generateEnvMarkdown,
    generateJsonSchemaFile,
    generateMarkdownFile,
} from '@deltabox/toolchain/config';

generateEnvFile(schema, { envPrefix: 'MYAPP_' });
generateConfigEnv(schema, { envPrefix: 'MYAPP_', outputDir: 'types' });
generateConfigTypes(schema, { outputDir: 'types' });
generateConfigMarkdown(schema, { outputDir: 'docs/reference' });
generateEnvMarkdown(collectDefinitions(schema, { envPrefix: 'MYAPP_' }));
generateMarkdownFile({ title: 'Docs', body: 'Hello.' });
generateCliOptions(schema, { envPrefix: 'MYAPP_', scope: 'cli' });
generateCliDocs(commands, { output: 'docs/cli.md' });

await generateConfigJsonSchema(schema, { baseGroup: ['base', 'server'] });
await generateJsonSchemaFile(schema, { output: 'config.schema.json' });

const formatted = await formatGenerated(source, { fileName: 'config.ts' });
```

## Runtime collection

`collect` resolves env vars and CLI args into a config object. It does not
validate unless `validate: true`.

```ts
import { collect, collectDefinitions, collectRequired } from '@deltabox/toolchain/config';

const config = collect(schema, {
    envPrefix: 'MYAPP_',
    envSource: process.env,
    argv: process.argv.slice(2),
    validate: true,
});

const definitions = collectDefinitions(schema, { envPrefix: 'MYAPP_' });
const required = collectRequired(schema, 'server');
```

## Runtime parsers

The parsers merge the enabled sources, apply overrides and validate by default.
All of them accept Zod, untyped and plain/primitive schemas.

```ts
import {
    parseCliConfig,
    parseConfig,
    parseEnvConfig,
    parseConfigAsync,
} from '@deltabox/toolchain/config';

// env + CLI + overrides
const config = parseConfig(schema, { port: 4000 }, { envPrefix: 'MYAPP_' });

// env only
parseEnvConfig(schema, process.env, { envPrefix: 'MYAPP_' });

// CLI only: --port 4000 --host localhost
parseCliConfig(schema, process.argv.slice(2), { envPrefix: 'MYAPP_' });

// Async variants accept promise inputs
await parseConfigAsync(schema, Promise.resolve({ port: 4000 }));
```

`ConfigParseError` is thrown when validation fails and
`errorOptions.errorLevel` is `throw` (the default). Its `issues` array contains
the validated paths and messages.

## Loaders

`loadConfig*` discover a config file, import it, merge `overrides` and then parse
the value through the passed `parser` (or `schema`). You do **not** need to call
`parseConfig`/`parseEnvConfig`/`parseCliConfig` after `loadConfig*`: it already
did that for you.

```ts
import { loadConfig, loadConfigAsync, loadConfigSync } from '@deltabox/toolchain/config';

const loaded = await loadConfigAsync({
    parser: z.object({
        port: z.number().default(3000),
        host: z.string().default('localhost'),
    }),
    cwd: process.cwd(),
    names: ['dbx.config.ts', 'dbx.config.js'],
    locations: ['.', 'config'],
    envPrefix: 'MYAPP_',
    validate: true, // default when a parser is provided
});

loaded?.config; // the parsed + validated value
loaded?.path; // the file that was loaded
```

Without a `parser`/`schema`, the raw loaded value is returned:

```ts
const raw = await loadConfig({ cwd: process.cwd() });
```

The parser-based loader also accepts the flat discovery fields (`cwd`, `names`,
`locations`, `packageJsonKeys`, `parent`, `accept`, `tsconfig`, `fresh`) as well
as `configFileOptions` when you need the full discovery shape.

`loadConfigSync` supports JSON/YAML/CJS and custom synchronous loaders;
`loadConfigAsync` also supports ESM and TypeScript.

`createConfigFile({ cwd, name?, content?, imports?, overwrite? })` writes a
starter `dbx.config.ts`.

## Schema utilities

```ts
import {
    compileZodSchema,
    flattenBaseSchema,
    isSchemaType,
    isZodSchema,
    metaOf,
    normalizeBaseGroups,
    normalizeConfigSchema,
    resolveUntypedSchema,
    splitBaseSchema,
    toSchemaType,
    zodToJsonSchema,
    zodToSchemaMap,
} from '@deltabox/toolchain/config';

isZodSchema(value); // Zod schema?
isSchemaType(value); // resolved untyped schema?

toSchemaType(schema); // Zod/plain value -> resolved untyped schema
resolveUntypedSchema({ port: 3000 }); // -> { properties: { port: { type: 'number', default: 3000 } } }
normalizeConfigSchema(schema); // -> { [scope]: resolvedSchema }
zodToJsonSchema(zodSchema); // -> untyped JSON Schema
zodToSchemaMap(zodSchema); // -> { [typeName]: resolvedSchema }
compileZodSchema(zodSchema); // best-effort Zod compile

normalizeBaseGroups(['base', 'server']); // ['base', 'server']
splitBaseSchema(schema, ['base', 'server']); // { base, groups, hasBase }
flattenBaseSchema(schema, ['base', 'server']); // base fields hoisted
metaOf(schema); // ConfigMeta | undefined
```

`renderTsType(node)` and `normalizeJsonSchemaMetadata(node)` are lower-level
helpers for custom JSON Schema pipelines.

## Environment helpers

```ts
import {
    envBool,
    envInt,
    envList,
    envMap,
    envPathOf,
    envString,
    envVarNameOf,
    parseEnvTree,
    readEnvPath,
} from '@deltabox/toolchain/config';

const tree = parseEnvTree(process.env, 'MYAPP_');
envString(tree, 'host', 'localhost');
envInt(tree, 'port', 3000);
envBool(tree, 'debug', false);
envList(tree, 'tags', []);
envMap(tree, 'headers.map');
readEnvPath(tree, 'auth.token');

envPathOf('MYAPP_AUTH_TOKEN', 'MYAPP_'); // auth.token
envVarNameOf('auth.token', 'MYAPP_'); // MYAPP_AUTH_TOKEN
```

## CLI generation

`generateConfigCliOptions(schema)` walks the config fields (not just env-backed
values) and treats each **schema scope as a CLI command**, with its fields as
options. It returns scoped and flat views:

```ts
import {
    configCliCommand,
    generateConfigCliOptions,
    toToolchainOptions,
} from '@deltabox/toolchain/config';

const result = generateConfigCliOptions(scopes, {
    flags: { 'auto.aliases': '--aliases' }, // optional custom mapping
    types: { auto: 'boolean' }, // override an ambiguous schema type
});

result.command.server; // { name: 'server', type: 'object', options: [...] }
result.commandEntries; // [['server', {...}], ['frontend', {...}]]
result.options; // every option across every command
result.optionsEntries; // [['--port', {...}], ...]

const options = toToolchainOptions(result.options);
// [{ flags: '--port <value>', description: 'HTTP port', default: '3000' }, ...]
```

`configCliCommand` builds a complete `ToolchainCommand` from the schema, parses
the provided flags into a validated config and passes it to `run`:

```ts
import { configCliCommand } from '@deltabox/toolchain/config';

export const serveCommand = configCliCommand({
    name: 'serve',
    description: 'Run the API server.',
    schema: serverConfig,
    // Extra command-specific options that are not config fields.
    options: [{ flags: '--json', description: 'Print JSON.' }],
    run: (values, config, context) => {
        // `config` is already parsed/validated from `values`.
        console.log(config, context.config);
    },
});

// Register it like any other ToolchainCommand:
registerToolchainCommands(program, [serveCommand]);
```

For an existing command, merge generated options into its descriptor:

```ts
import { generateConfigCliOptions, toToolchainOptions } from '@deltabox/toolchain/config';

const command = {
    name: 'tsconfig',
    description: 'Generate workspace tsconfig files.',
    options: [
        { flags: '--cwd <dir>', description: 'Project root.' },
        ...toToolchainOptions(generateConfigCliOptions(tsconfigConfigSchema).options),
        { flags: '--json', description: 'Print the resolved config.' },
    ],
    run: (values, context) => {
        // values from generated flags are available alongside custom flags
    },
};
```

`configCommands` returns the library `config:*` generator commands; it does not
add commands to the `dbx` binary.

### `CliOptionDef`

`CliOptionDef` carries the config metadata a CLI builder needs:

| Field         | Purpose                                          |
| ------------- | ------------------------------------------------ |
| `flag`        | Long flag (`--auto-aliases`).                    |
| `short`       | Optional shorthand (`-a`).                       |
| `env`         | Env var, for env-backed options.                 |
| `type`        | `string`, `number`, `boolean`, `array`, ...      |
| `description` | Config description.                              |
| `default`     | Stringified default.                             |
| `required`    | Config value is required.                        |
| `multiple`    | Repeated occurrences collect into an array.      |
| `choices`     | Allowed enum values, when available.             |
| `scope`       | Config scope.                                    |
| `path`        | Dotted config path (`auto.aliases`).             |
| `parse`       | Coerce one raw CLI string into the config value. |

## Root helpers

```ts
import { findProjectRoot, monorepoRoot } from '@deltabox/toolchain/config';

findProjectRoot(process.cwd()); // nearest project root
monorepoRoot(process.cwd()); // nearest workspace root
```

## Types

All types can be found at
[packages/config/src/types](https://github.com/deltabox-studio/toolchain/tree/main/packages/config/src/types).
