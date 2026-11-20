# CLI commands docs

`configCommands({ engine, defaults })` returns `CliCommand[]` (register them
on your cli program with `@deltabox/toolchain/cli`) and can be used to generate config artifacts:

| Command           | Writes                                       |
| ----------------- | -------------------------------------------- |
| `config:env`      | `.env.example`                               |
| `config:types`    | config types (`--env` also writes env types) |
| `config:json`     | `config.json` (metadata)                     |
| `config:schema`   | `config.schema.json`                         |
| `config:markdown` | the markdown reference                       |
| `config:cli`      | `cli-options.json`                           |
| `config:all`      | everything, under one output directory       |

```ts
import { configCommands } from '@deltabox/toolchain/config';

const commands = configCommands({
    engine,
    defaults: { typesDir: 'packages/shared/src/types', docsDir: 'docs/reference' },
});
// register `commands` on your cli program
```

> These commands are library-only: `dbx` itself does not register a `config:*`
> group, because each command needs a `ConfigEngine` bound to your schema. Add
> the returned commands to your own program.

The `config:*` commands generate config artifacts; they do not write the CLI
reference. For that, pass the command descriptors your CLI registers to
[`generateCliDocs()` or `engine.markdown.cli.write()`](/guide/config-generator/generate#cli-docs).

## Deriving flags from config fields

When a command flag maps to a config field, generate the option from the schema
instead of hand-writing its flag, description and default. The recommended
entry point is `engine.cli.program.create()`:

```ts
const { commands } = engine.cli.program.create(cmd => [
    cmd('tsconfig')
        .description('Generate workspace tsconfig files.')
        // Genuine runtime flags stay explicit (the escape hatch).
        .options([
            { flags: '--cwd <dir>', description: 'Repo root.' },
            { flags: '--json', description: 'Print the resolved config.' },
        ])
        .run(({ config }) => {
            // `config` is the validated `tsconfig` section.
        }),
]);
```

Config-backed flags are derived recursively: objects and union object branches
expand to dotted paths (`sync.format` → `--format-*`), scalar arrays become list
flags, and arrays of objects/records/maps are skipped unless the field defines
`cli` metadata. Use `engine.cli.program.createCommand(scope, spec)` when you want the
runtime `values` object inferred from the command's `options` list. Metadata
lives in the schema:

```ts
port: z.number().default(3000).meta({ cli: { short: 'p' } }),
aliases: z.boolean().default(true).meta({
    cli: { flag: '--no-aliases', type: 'boolean', description: 'Skip path aliases.' },
}),
internal: z.string().meta({ cli: false }),
format: z.union([z.boolean(), z.object({ fix: z.boolean() })]).meta({
    cliCommand: { name: 'format', description: 'Format the managed files.' },
}),
```

`cli: false` removes a field (and its subtree) from generated flags without
hiding it from env/types/docs. `cliCommand: false` opts a scope out of automatic
command generation. Env exposure still comes from `envName`/`envPath`; set
`envExpose: false` for CLI-only values. Runtime-only flags (`--cwd`, `--json`,
`--force`, `--dry-run`, output selectors) always stay in the command spec; an
option with a `path` intentionally maps a runtime flag back to a config field.

The lower-level helpers remain available for existing descriptors:

```ts
import { configCliOptions } from '@deltabox/toolchain/config';

const options = [
    { flags: '--json', description: 'Print the resolved config.' },
    ...configCliOptions(tsconfigConfigSchema),
];
```

Config defaults are applied by the command context, so only explicitly typed
flags are forwarded. `configCliCommand` wraps the same generation with parsing
and validation when the whole command is config-shaped. Use `includePaths` /
`excludePaths` only as a narrow escape hatch; a flag that is not a config field
(output mode, `--cwd`, `--restore`, provider options) stays hand-written and
documented as runtime-only.
