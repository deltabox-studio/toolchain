# Subpath exports

| Import                          | What it provides                                                               |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `@deltabox/toolchain/cli`       | Build/register the `dbx` commander program + bare-command routing.             |
| `@deltabox/toolchain/core`      | Load `dbx.config.*`, run/watch sync, the project graph, manifest, reset.       |
| `@deltabox/toolchain/config`    | The Zod/env config engine, generators and the `config:*` commands.             |
| `@deltabox/toolchain/vite`      | Resolve/run `vp`, the Vite+ provider, the `dbx()` plugin and `vite` sync.      |
| `@deltabox/toolchain/migrate`   | Pluggable migrations to Oxfmt/Oxlint (Biome, ESLint, Prettier, Dprint).        |
| `@deltabox/toolchain/template`  | The builtin/local/online template registry, loading and scaffolding.           |
| `@deltabox/toolchain/providers` | The provider registry (`toolchainProviders`) the editor reads.                 |
| `@deltabox/toolchain/tsdown`    | The tsdown base config, `createTsdownConfig`, post banner and cleanup.         |
| `@deltabox/toolchain/tsconfig`  | The tsconfig sync task, templates and the tsconfig generator.                  |
| `@deltabox/toolchain/changelog` | The changelog runner, workflows, commitlint and the changelog sync task.       |
| `@deltabox/toolchain/biome`     | The generic Biome config, rendering helpers and the biome sync task.           |
| `@deltabox/toolchain/project`   | Project/monorepo/workspace file generation and `dbx.config.ts` scaffolding.    |
| `@deltabox/toolchain/shared`    | The config model, logger, provider model, template engine, `run`/`spawnCross`. |
