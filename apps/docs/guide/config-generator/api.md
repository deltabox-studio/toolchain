# API reference

Everything is exported from the `@deltabox/toolchain/config` subpath. The engine
and the standalone functions share the same schemas and options, so you can start
with the engine and drop to a single generator when you only need one artifact.

```ts
import {
    ConfigProgramError,
    createConfigEngine,
    createConfigProgram,
    generateConfigProgram,
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
const commands = [/* your CliCommand descriptors */];

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
//   diagnostics: [...],
// }

// The high-level program: chained commands with schema-derived flags + typed config
const { commands } = engine.cli.program.create(cmd => [
    cmd('server')
        .option({ flags: '--json', description: 'Print JSON.' })
        .run(({ config, values, context }) => {
            // `config` is the resolved `server` section.
        }),
]);
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
    generateConfigProgram,
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
const generated = generateConfigProgram(schema, { envPrefix: 'MYAPP_' });

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
`source` accepts `'file' | 'env' | 'cli'` or an ordered array such as
`['env', 'cli']`. All of them accept Zod, untyped and plain/primitive schemas.

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

// An explicit source set
parseConfig(schema, {}, { source: ['env', 'cli'], envPrefix: 'MYAPP_' });

// Async variants accept promise inputs
await parseConfigAsync(schema, Promise.resolve({ port: 4000 }));
```

`ConfigParseError` is thrown when validation fails and
`errorOptions.errorLevel` is `throw` (the default). Its `issues` array contains
the validated paths and messages.

## Loaders

`loadConfig*` discover a config file, import it, layer env vars and CLI args over
the file value, merge `overrides` and validate through the passed `parser` (or
`schema`). The precedence is **file -> env -> CLI -> overrides -> validation**.
You do **not** need to call `parseConfig`/`parseEnvConfig`/`parseCliConfig` after
`loadConfig*`: it already did that for you. Use the parsers when you have no file
to load.

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
    source: ['file', 'env', 'cli'], // the default
    validate: true, // default when a parser is provided
});

loaded?.config; // the parsed + validated value
loaded?.path; // the file that was loaded
```

The source-specific family makes the selection explicit:

| Loader            | Sources                    |
| ----------------- | -------------------------- |
| `loadConfig*`     | file + env + CLI (default) |
| `loadEnvConfig*`  | file + env                 |
| `loadCliConfig*`  | file + CLI                 |
| `loadFileConfig*` | file only                  |

Each has `Sync` and `Async` variants. `source` also accepts a union on the
loaders, so `source: ['env', 'cli']` is equivalent to the default.

Without a `parser`/`schema`, the raw loaded value is returned:

```ts
const raw = await loadConfig({ cwd: process.cwd() });
```

The parser-based loader also accepts the flat discovery fields (`cwd`, `names`,
`locations`, `packageJsonKeys`, `parent`, `accept`, `tsconfig`, `fresh`) as well
as `configFileOptions` when you need the full discovery shape.

The default discovery names are neutral (`config.ts`, `config.js`,
`config.json`, ...), never `dbx.config.*`. Pass `names` or
`configFileOptions.filename` for an application-specific name.

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
    includePaths: ['server', 'frontend.origin'], // optional path filter
    excludePaths: ['frontend.secrets'],
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

`configCliCommand` builds a complete `CliCommand` from the schema, parses
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

// Build it into the engine program like any other CliCommand:
const program = engine.cli.program.create(() => [serveCommand]);
await program.invokeAsync();
```

For an existing command, prefer `engine.cli.program.create()` and keep only
genuinely non-config flags (output modes, `--cwd`, `--json`, `--restore`)
hand-written. The low-level `configCliOptions` one-liner remains available when
you already have a command descriptor:

```ts
import { configCliOptions } from '@deltabox/toolchain/config';

const command = {
    name: 'tsconfig',
    description: 'Generate workspace tsconfig files.',
    options: [
        // The escape hatch: runtime selectors that are not config fields.
        { flags: '--cwd <dir>', description: 'Project root.' },
        { flags: '--json', description: 'Print the resolved config.' },
        // Config-backed options, generated recursively from the schema.
        ...configCliOptions(tsconfigConfigSchema),
    ],
    run: (values, context) => {
        // values from generated flags are available alongside custom flags
    },
};
```

### `engine.cli.program`

`engine.cli.generate()` and `engine.cli.options()` keep their low-level
behavior; `engine.cli.program.create()` is the command-level entry point:

```ts
const program = engine.cli.program.create(cmd => [
    cmd('serve')
        .description('Run the server.')
        .option({ flags: '--json', description: 'Print JSON.' })
        .option({ flags: '--listen <port>', path: 'port', type: 'number' })
        .command('serve', status =>
            status
                .name('status')
                .description('Print the resolved status.')
                .option({ flags: '--short', description: 'Short output.' })
                .run(({ config, values }) => {
                    // typed `serve` config + `short` value
                })
        )
        .run(({ config, values, context }) => {
            // config: the validated `serve` section
            // values: the explicit CLI values
            // context: the host CliCommandContext (dbx widens it to ToolchainCommandContext)
        }),
]);

await program.invokeAsync();
```

`create()` returns a built program: `program.commands` is the normalized command
list (a single command stays a single command; an empty list generates one
command per eligible scope). `createCommand(scope, spec)` builds one config-backed
command without a program; `cmd('name', spec)` / `createCommand('name', spec)`
build a runtime-only command without a config scope. The callback may be async;
`create()` then returns a promise.

`ConfigScopeCommand` chains support `name`, `description`, `version`, `argv`,
`bin`, `option`/`options`, `globalOption`/`globalOptions`, `inherit`,
`command`/`commands`, `subcommand`/`subcommands`, `onError` and terminal `run`.
`onError(error, context)` receives the loaded host context. Omit `run` for a
grouping command; it registers with its subcommands.

#### Program members and options

A `ConfigProgram` exposes the runtime surface:

| Member                                   | Description                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `commands`                               | The normalized commands (single command stays single).                  |
| `globals`                                | The program-level global options.                                       |
| `helpOnError`                            | Whether to print help after an invalid-argv error (`false` by default). |
| `name()` / `description()` / `version()` | Set the metadata shown in help/version output.                          |
| `output(writeOut, writeErr?)`            | Route help/version output; `writeErr` is reserved for error rendering.  |
| `globalOption()` / `globalOptions()`     | Append program-level globals.                                           |
| `argv(values)`                           | Set the explicit argv used by `invoke()`.                               |
| `withContext(context)`                   | Set the default host context.                                           |
| `configure(format)`                      | Merge help/error formatting options.                                    |
| `formatHelp(command?)`                   | Render program or command help.                                         |
| `formatError(error)`                     | Render an error with the configured template.                           |
| `invoke(argv?, context?)`                | Run synchronously (async handlers/resolvers throw).                     |
| `invokeAsync(argv?, context?)`           | Run and await async handlers, hooks and resolvers.                      |
| `hook()` / `hooks()`                     | Register inferred before/after hooks.                                   |

Build the program through the engine — this is the preferred entry point because
it infers the config/values types and accepts the full program options:

```ts
const program = engine.cli.program.create(
    cmd => [
        cmd('serve', {
            name: 'serve',
            description: 'Serve.',
            run: ({ config, values, context }) => {},
        }),
    ],
    {
        name: 'myapp',
        description: 'Myapp tooling.',
        version: '1.0.0',
        globalOptions: [{ flags: '--json', description: 'Print JSON.' }],
        context: { cwd: process.cwd() },
        disableColors: ({ color }) => color === false,
        writeOut: text => process.stdout.write(text),
        writeErr: text => process.stderr.write(text),
    }
);
```

`argv` defaults to `process.argv.slice(2)`, `name` defaults to `'program'`, and
`disableColors` defaults to `false`. `program.configure()` merges formatting;
`program.argv()`, `program.withContext()` and `program.output()` set the runtime
pieces.

`helpOnError` defaults to `false`, so invalid argv throws a
`ConfigProgramError` without printing help. Pass `helpOnError: true` and append
`program.formatHelp()` in your catch handler when you want the full help text:

```ts
program.invokeAsync().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof ConfigProgramError && program.helpOnError) {
        console.error(program.formatHelp());
    }
    process.exitCode = 1;
});
```

Use the lower-level `createConfigProgram(commands, options?)` only when you
already have a command list that is not tied to an engine. It accepts the same
options and is what `engine.cli.program.create()` calls internally.

Program types: `ConfigProgram`, `ConfigProgramOptions`,
`ConfigProgramFormatOptions`, `ConfigProgramCommand`, `ConfigScopeCommand`,
`ConfigCommandBuilder`, `ConfigEngineCliProgram` and `ConfigProgramError`.

The standalone equivalent is
`generateConfigProgram(schema, { envPrefix, ... })`: it returns `CliCommand[]`
with schema-derived options. Use `engine.cli.program.create()` when you want the
typed `run({ config, values, context })` callback. See
[Generate → CLI program](/guide/config-generator/generate#cli-program).

#### `ConfigProgramError`

Invalid argv throws a `ConfigProgramError` with `code` (for example
`unknownCommand`, `unknownOption`, `missingOptionValue`, `invalidValue`,
`missingCommand`), `input` and an optional misspelling `suggestion`. Use
`format.error.messages` to override the messages and `program.formatError()` to
render one. Help is only printed when `helpOnError` is enabled (see
[Program members and options](#program-members-and-options)).

Options and subcommands have commander-style shorthands as well as array forms:

```ts
engine.cli.program.create(cmd => [
    cmd('serve')
        .description('Run the server.')
        .option('--json', 'Print JSON.')
        .options([
            ['--out <dir>', 'Output directory.', 'dist'],
            '--check',
            { flags: '--tag <value...>', description: 'Tags.' },
        ])
        .command('serve', 'Status.', status =>
            status
                .name('status')
                .option('--short', 'Short output.')
                .run(({ values }) => {
                    // values.short?: boolean
                })
        )
        .commands([['serve', 'Info.', info => info.name('info').run(() => {})], ['build']])
        .run(({ config, values }) => {
            // typed serve config + values
        }),
]);
```

`.options(...list)` and `.commands(...list)`/`.subcommands(...list)` accept the
same inputs spread as separate arguments. A subcommand definition may be an
already-built `CliCommand`, a `[scope, setup]` / `[scope, description, setup]`
tuple, or `{ scope, description?, setup? }`.

#### Global options

Define options once at program level and every command parses them:

```ts
const program = engine.cli.program.create(
    cmd => [
        cmd('sync').option('--check', 'Check only.').run(syncHandler),
        cmd('build').run(buildHandler),
    ],
    { globalOptions: [{ flags: '--json', description: 'Print JSON.' }] }
);

// Or after creation:
program
    .globalOption('--verbose', 'Verbose output.')
    .globalOptions([['--cwd <dir>', 'Project root.']]);
```

Commands can declare their own global options too. A subcommand only receives
the parent command's globals when it opts in with `.inherit()` (or
`inherit: true` in a command definition). Program globals always apply.

```ts
cmd('serve')
    .globalOptions([['--root <dir>', 'Project root.'], '--verbose'])
    .command('serve', status =>
        status
            .name('status')
            .inherit()
            .run(({ values }) => {
                // values.root / values.verbose are typed and parsed
            })
    )
    .run(({ values }) => {
        // the parent sees its own globals too
    });
```

Resolution order is loaded config section → env vars → explicit CLI values →
command-spec `overrides` → schema validation. Return an empty array
(`create(() => [])`) to generate one command per eligible scope;
`cliCommand: false` opts a scope out. Command metadata (`cliCommand`) supplies
`name`, `description`, `aliases`, `hidden`, `passthrough` and `args` when a
chain omits them.

`scope` is a literal union of the schema's scopes, and `run.config` is inferred
from that scope (via `ConfigOf`), so no explicit generic is needed. A
single-schema engine infers the whole schema. `ConfigProgramCommand<TConfig>`
stays exported as the base shape for custom program generators and wrappers.

The host context is generic: `ConfigProgramRunContext<TConfig, TContext =
CliCommandContext>` and `ConfigCliCommandOptions<TSchema, TContext =
CliCommandContext>` default to the minimal `{ cwd }` context. Use the callback
form to select a wider context and build commands with both `config` and
`values` inferred:

```ts
engine.cli.program.create<ToolchainCommandContext>(cmd => [
    cmd('sync')
        .description('Regenerate managed files.')
        .option({ flags: '--check', description: 'Check only.' })
        .option({ flags: '--only <tasks>', description: 'Task names.' })
        .option({ flags: '--json', description: 'Print JSON.' })
        .run(({ config, values, context }) => {
            // config: boolean | ToolchainSyncConfig
            // values.check?: boolean, values.only?: string, values.json?: boolean
            // context: ToolchainCommandContext
        }),
]);
```

Because `cmd()` is called directly, its literal `scope` and chained `option()`
calls drive the inference; `create<Context>()` only fixes the host context.
The engine itself stays schema-inferred.

Chained commands are self-contained; use `.command(scope, setup)` for typed
subcommands. Return an empty array (`create(() => [])`) to generate one command
per command-eligible scope.

#### Running a built program

A built program is commander-like: `invoke()` runs synchronously and
`invokeAsync()` awaits async handlers. `argv` defaults to
`process.argv.slice(2)` unless the program or one of its commands sets
`argv: [...]`.

```ts
const program = engine.cli.program.create(cmd => [
    cmd('sync').option({ flags: '--check', description: 'Check only.' }).run(handler),
    cmd('build').option({ flags: '--out <dir>', description: 'Output.' }).run(handler),
]);

program.argv(['sync', '--check']);
program.withContext({ cwd: process.cwd() });
await program.invokeAsync();
// or pass both explicitly:
await program.invokeAsync(['build', '--out', 'dist'], { cwd: process.cwd() });
```

Options are scoped per command: a subcommand never receives its parent's or a
sibling's flags. A sole command with no subcommands is treated as the root
command, so `invokeAsync(['--check'])` runs it without repeating the name.
Invalid argv throws a `ConfigProgramError` whose message includes a misspelling
suggestion; override the messages or render it with `program.formatError()`.

```ts
program.configure({
    error: { messages: { unknownCommand: input => `no such command: ${input}` } },
});
```

#### Help, errors, hooks and binaries

Help and error output are colourless by default. Supply colour hooks (for
example `picocolors`) to opt in; the defaults merge recursively into
subcommands and can be overridden per command, option, value, description and
usage. The default help template is `'plain'`; the default error template is
`'message'`.

```ts
import pc from 'picocolors';

program.configure({
    colors: {
        command: pc.cyan,
        option: pc.yellow,
        value: pc.green,
        description: pc.gray,
        usage: pc.bold,
    },
    options: { '--json': pc.magenta },
    commands: { sync: { colors: { command: pc.green } } },
    help: {
        template: 'box', // 'plain' (default) | 'box' | (model) => string
        box: {
            corners: { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘' },
            padding: 1,
        },
    },
    error: {
        // 'message' (default) | 'box' (message + stack) | custom formatter
        template: 'box',
        showStack: false,
        messageColor: pc.red,
    },
});

program.formatHelp('sync');
program.formatError(error);
```

`help.template: 'box'` wraps the commander-style content in the rounded box.
`error.template: 'box'` renders one box per error; `'message'` prints only the
message. Error formatting also exposes `messageColor`, `stackColor`,
`showStack`, `messageOnly`, `box` and `messages` (the invalid-argv message
overrides). Custom formatters receive the resolved `ConfigHelpModel` (`name`,
`description`, `usage`, `options`, `commands`, `command`) or `ConfigErrorModel`
(`errors[]`). Per-command overrides live under `commands[name]` and per-option
colors under `options['--flag']`.

Set `disableColors` when the host has its own colour switch. A function receives
the parsed program globals and the invocation context, so a `--no-color` flag
can turn every configured hook off at runtime:

```ts
const program = engine.cli.program.create(
    cmd => [
        cmd('serve', {
            name: 'serve',
            description: 'Serve.',
            run: () => {},
        }),
    ],
    {
        globalOptions: [{ flags: '--no-color', description: 'Disable colours.' }] as const,
        disableColors: ({ color }) => color === false,
    }
);
```

The callback may be async. `invoke()` requires a synchronous resolver; use
`invokeAsync()` (the normal CLI path) for async predicates.

Hooks run around the selected action and infer every declared command's
context, scope, name and runtime `values`:

```ts
program
    .hook('before', 'all', ({ name, scope, values, context }) => {})
    .hook('after', 'sync', ({ values }) => {
        // values is typed from the `sync` command's options
    })
    .hooks({ phase: 'before', target: 'build', handler: async payload => {} });
```

Set `bin` on a command to execute a relative or absolute binary instead of the
in-process handler; the arguments after the command name are forwarded verbatim.

```ts
cmd('deploy')
    .bin('./scripts/deploy.mjs')
    .run(() => {});
```

The same inference applies to `configCliCommand({ options: [...] })`: its
`run`/`parse` values are typed from the extra runtime options, while
schema-derived values remain addressable through the index signature.

### Schema metadata for CLI

```ts
const serveConfig = z.object({
    port: z
        .number()
        .default(3000)
        .meta({
            cli: { short: 'p', description: 'HTTP port.' },
        }),
    aliases: z
        .boolean()
        .default(true)
        .meta({
            cli: { flag: '--no-aliases', type: 'boolean', description: 'Skip aliases.' },
        }),
    internal: z.string().meta({ cli: false }), // never a generated flag
    format: z.union([z.boolean(), z.object({ fix: z.boolean(), command: z.string() })]),
});
```

`cli: false` prunes a field and its subtree from generated flags (env/types/docs
still include it). Arrays of scalars become list flags; arrays of objects,
records, maps and sets are skipped unless a field defines `cli` explicitly.
Ambiguous union paths are omitted and reported through the generator
`diagnostics`. Env exposure stays on `envName`/`envPath`; set
`envExpose: false` to keep a value CLI-only.

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
| `hidden`      | Registered but omitted from generated docs.      |
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
