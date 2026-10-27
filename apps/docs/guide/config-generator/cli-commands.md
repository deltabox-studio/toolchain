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
