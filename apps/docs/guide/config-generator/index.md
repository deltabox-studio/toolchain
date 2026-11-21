# Config Generator

`@deltabox/toolchain/config` is a configuration engine.

**A Zod, untyped or plain-value schema is the single source of truth**.

1. Attach metadata with `.meta()` (or use the untyped/plain input)
2. Then generate the:
    - Env/config TypeScript types
    - JSON Schema
    - markdown reference
    - config metadata JSON
    - CLI commands/option definitions
    - CLI reference

All from that one schema.

## Where to start

- [Describe a scope](/guide/config-generator/describe-a-scope) — write the Zod,
  untyped or plain schema and its `.meta()`.
- [Create the engine](/guide/config-generator/create-the-engine) — bind the
  schema, prefix, base group(s) and root.
- [Generate](/guide/config-generator/generate) — the generator methods.
- [CLI commands](/guide/config-generator/cli-commands) — the `config:*` command
  descriptors.
- [CLI program](/guide/config-generator/generate#cli-program) — build schema
  commands into a runnable program with `invoke`, hooks and formatting.
- [Load the config](/guide/config-generator/load-the-config) — the runtime
  parsers and `loadConfig*` (which already parse the loaded file).
- [Generated outputs](/guide/config-generator/generated-outputs) — types,
  markdown, env files, JSON Schema, CLI docs and formatting.
- [Client and server](/guide/config-generator/client-and-server) — split browser
  and server schemas/engines so bundled code never crosses contexts.
- [Real-world shape](/guide/config-generator/real-world-shape) — how a consumer
  binds the engine end-to-end.

```ts
import { createConfigEngine } from '@deltabox/toolchain/config';
```

## API reference

Every export, option and code example
can be found in the full [API reference](/guide/config-generator/api).
