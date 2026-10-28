# Config Generator

`@deltabox/toolchain/config` is a generic, Zod-backed configuration engine. A
**Zod schema is the single source of truth**: attach env metadata to leaves with
`.meta()`, then generate the `.env` file, env/config TypeScript types, a JSON
Schema, a markdown reference, config metadata JSON and CLI option definitions —
all from that one schema.

## Where to start

- [Describe a scope](/guide/config-generator/describe-a-scope) — write the Zod
  schema and its `.meta()`.
- [Create the engine](/guide/config-generator/create-the-engine) — bind scopes,
  prefix, base group and root.
- [Generate](/guide/config-generator/generate) — the generator methods.
- [CLI commands](/guide/config-generator/cli-commands) — the `config:*` command
  descriptors.
- [Load the config](/guide/config-generator/load-the-config) — the runtime loader
  (`parseEnvTree`, `compileZodSchema`, and `applyOverrides` from shared).
- [Generated outputs](/guide/config-generator/generated-outputs) — types,
  markdown, env files, JSON Schema and formatting.
- [Real-world shape](/guide/config-generator/real-world-shape) — how a consumer
  binds the engine end-to-end.

```ts
import { createConfigEngine } from '@deltabox/toolchain/config';
```
