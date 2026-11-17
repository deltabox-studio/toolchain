# CLI commands

`configCommands({ engine, defaults })` returns `ToolchainCommand[]` (register them
on your commander program with `@deltabox/toolchain/cli`):

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
// register `commands` on your commander program
```

> These commands are library-only: `dbx` itself does not register a `config:*`
> group, because each command needs a `ConfigEngine` bound to your schema. Add
> the returned commands to your own program.

The `config:*` commands generate config artifacts; they do not write the CLI
reference. For that, pass the command descriptors your CLI registers to
[`generateCliDocs()`](/guide/config-generator/generate#cli-docs).
