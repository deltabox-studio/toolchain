# Programmatic API

Every surface the CLI and the extension use is also importable. The umbrella
package re-exports the config model + sync runner and every workspace package, so
a consumer can import the whole surface from the root or a single package through
a subpath.

## Umbrella (`@deltabox/toolchain`)

The root re-exports `@deltabox/toolchain-core` and `@deltabox/toolchain-shared`
**directly**, and exposes the remaining packages as **namespaces** plus the sync
runner:

```ts
import {
    // identity helper (typed config)
    defineConfig,
    // config + sync
    loadToolchainConfig,
    runSync,
    runWatch,
    defaultSyncTasks,
    // opt-in-by-presence helpers
    sectionEnabled,
    sectionConfig,
    resolveTokens,
    // logging
    logger,
    createLogger,
} from '@deltabox/toolchain';
// The other packages are namespaced:
import {
    biome,
    changelog,
    config,
    core,
    project,
    shared,
    tsconfig,
    tsdown,
} from '@deltabox/toolchain';
```

```ts
const { config, tokens, projectType } = await loadToolchainConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```

## Subpath exports

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

## Package reference

### `@deltabox/toolchain/shared`

The base layer: the config model, logging, process/string/object utilities and
the template engine.

| Export                                                           | Description                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `defineConfig(config)`                                           | Identity helper for a typed `dbx.config.*`.                               |
| `sectionEnabled(section)` / `sectionConfig(section)`             | Opt-in-by-presence helpers for a config section.                          |
| `resolveTokens(config)`                                          | Flatten a config into `{{ token }}` replacements.                         |
| `CONFIG_FILE_NAMES`                                              | The config file names the loader probes, in priority order.               |
| `repoSlugFromUrl(url)`                                           | Derive an `owner/name` slug from a repository URL.                        |
| `createLogger(options)` / `logger`                               | The shared logger (see [Logging](#logging)).                              |
| `spawnCross(cmd, args, options)` / `run(cmd, args, options)`     | Cross-platform, shell-free process spawning.                              |
| `readJsonFile` / `readJsonAt` / `toJson` / `writeJsonFile`       | Small JSON file helpers.                                                  |
| `mergeJsonAt(cwd, relative, patch)`                              | Deep-merge a patch over an existing JSON file.                            |
| `deepMerge` / `isPlainObject` / `sort` / `mapValues`             | Object utilities.                                                         |
| `applyReplacements` / `applyReplacementsDeep` / `createReplacer` | The `{{ token }}` template engine (also `tokenPattern`, `extractTokens`). |
| `toYaml(value)`                                                  | A tiny YAML emitter for the GitHub Actions subset.                        |

The config **types** and **schemas** also live here: `ToolchainConfig`, `DbxConfig`,
`SyncTask`, `SyncContext`, `ManagedFile`, `ToolchainCommand`, `ToolchainOption`,
`ToolchainProvider`, `ToolchainViteConfig` (Vite+'s config type), `Replacements`,
and the generated `config-types` /
`config-schema` exports.

```ts
import { defineConfig, sectionEnabled, applyReplacements } from '@deltabox/toolchain/shared';

const text = applyReplacements('Hello {{name:world}}', { name: 'acme' });
```

### `@deltabox/toolchain/core`

Loads `dbx.config.*`, builds the project graph and runs the sync tasks.

| Export                                                        | Description                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `loadToolchainConfig(cwd?)`                                   | Find + load the config, resolve tokens and the project type.           |
| `findConfigFile(cwd?)`                                        | The config file path, if any.                                          |
| `runSync(options)`                                            | Run the given `SyncTask[]` and return the summary.                     |
| `runWatch(options)`                                           | Sync once, then watch inputs and re-sync.                              |
| `buildProjectGraph(root, options?)`                           | Discover workspace packages and their dependencies.                    |
| `orderProjects(nodes)` / `detectPackageManager(root)`         | Dependency ordering and package-manager detection.                     |
| `writeProjectGraph` / `readProjectGraph`                      | Persist/read `.dbx/toolchain/projects.json`.                           |
| `selectProjects(options)`                                     | Select projects by kind/name/glob.                                     |
| `resetToolchain(options)` / `resetProjects(options)`          | Remove generated files, the manifest and/or the config.                |
| `vscodeSyncTask(options?)`                                    | The VS Code settings/extensions sync task.                             |
| `resolveProjectType(cwd, config?)` / `detectProjectType(cwd)` | The project kind (`monorepo-root` / `monorepo-workspace` / `project`). |
| `readManifest(cwd)` / `writeManifest(cwd, files)`             | The `.dbx/toolchain/manifest.json` helpers.                            |

### `@deltabox/toolchain/config`

The generic Zod/env engine (see the [Config Generator](/guide/config-generator)
guide for the full workflow).

| Export                                                                                   | Description                                               |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `createConfigEngine(options)`                                                            | Bind scopes + prefix + root into a reusable engine.       |
| `configCommands({ engine, defaults? })`                                                  | The `config:*` commands for a consumer's own CLI.         |
| `formatGenerated(source, options?)`                                                      | Format generated output with Oxfmt (see below).           |
| `GENERATED_FORMAT_OPTIONS`                                                               | The baseline Oxfmt options used by the generators.        |
| `parseEnvTree(env, prefix?)` / `envString` / `envInt` / `envBool` / `envList` / `envMap` | The dependency-free runtime loader.                       |
| `applyOverrides(base, overrides?)`                                                       | Layer typed overrides over env-derived values.            |
| `compileZodSchema(schema)`                                                               | Compile a Zod schema for fast repeated parsing.           |
| `envPathOf(env, prefix?)` / `envMetaOf(schema)`                                          | Env-name to dotted-path derivation and `.meta()` reading. |
| `findProjectRoot(start?)` / `monorepoRoot(from?)`                                        | Walk up to the nearest `package.json`.                    |
| `renderConfigTypes` / `renderAllConfigTypes` / `generateConfigTypes`                     | Config type generation.                                   |
| `renderScopeMarkdown` / `generateConfigMarkdown` / `renderConfigFileMarkdown`            | Markdown reference generation.                            |
| `generateConfigJsonSchema` / `generateJsonSchemaFile`                                    | JSON Schema generation.                                   |
| `generateEnv` / `generateEnvDts` / `generateEnvTypes`                                    | `.env` / env type generation.                             |
| `generateCliOptions` / `flagOf` / `cliFlagOf` / `createCliArgsParser`                    | CLI option generation + parsing.                          |

### `@deltabox/toolchain/vite`

The Vite+ provider: resolving/running `vp`, the `dbx()` plugin and the `vite`
sync task (see the [Providers](/guide/providers) guide).

| Export                                                             | Description                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `resolveVp(cwd?)` / `hasVp(cwd?)` / `runVp(args, options?)`        | Resolve and run the `vp` binary (local shim, global, then `npx`).    |
| `vpVersion(cwd?)` / `describeVp(cwd?)` / `which(bin)`              | Version, resolution description and PATH lookup.                     |
| `VP_COMMANDS` / `viteCommandName(name)` / `resolveVpCommand(name)` | The `vp` command catalog + name/alias resolution.                    |
| `viteProvider()` / `viteCommands()`                                | The provider descriptor and the `dbx vite:*` commands.               |
| `dbx(options?)` / `DBX_TASKS`                                      | The Vite/Vite+ plugin and the `run.tasks` to spread in.              |
| `resolveDbx(cwd?)` / `runDbx(args, cwd?)`                          | Resolve/run the `dbx` binary (always the project's own first).       |
| `resolveVite(dbxConfig?, options?)`                                | Resolve `toolchain.vite` from a `dbx.config.*` (or a passed config). |
| `renderViteConfig()` / `viteConfigObject(config?)`                 | The managed `vite.config.ts` shim + the section minus `config`.      |
| `viteSyncTask()`                                                   | The `vite` sync task that writes the shim.                           |

### `@deltabox/toolchain/cli`

| Export                                         | Description                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `registerToolchainCommands(program, commands)` | Wire framework-agnostic commands onto a commander program.             |
| `builtinCommands()`                            | The commands built into the root CLI (config commands need an engine). |
| `createCli()`                                  | Build the `dbx` commander program.                                     |
| `runCli(argv?)`                                | Parse and run the CLI (extracts logger flags, defaults bare Vite+).    |
| `withDefaultVite(argv, commandNames?)`         | Insert `vite` before a bare Vite+ command.                             |
| `extractLogOptions(argv)`                      | Pull `--log-level` / `--color` / `--no-color` out of argv.             |

See the [CLI](/guide/cli) guide for the routing behaviour.

### `@deltabox/toolchain/migrate`

| Export                                                                              | Description                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `migrations()` / `listMigrations(cwd)` / `detectMigrations(cwd)`                    | The registered migrations and detection.         |
| `findMigration(idOrFrom)` / `runMigration(...)` / `runDetectedMigrations(ctx)`      | Run one or every detected migration.             |
| `biomeToOx` / `eslintToOx` / `prettierToOx` / `dprintToOx` / `viteToToolchain`      | The built-in `ToolchainMigration` objects.       |
| `mapBiomeToOxfmt` / `mapBiomeToOxlint` / `mapPrettierToOxfmt` / `mapDprintToOxfmt`  | Source-to-Ox mapping helpers.                    |
| `extractViteObject(source)` / `scanLiteralObject(text)` / `foldViteIntoConfig(...)` | The `vite` source's extraction + splice helpers. |
| `diffFiles(files)` / `hasPending(diffs)`                                            | Diff planned files against disk (for `--check`). |
| `mergeViteConfig(source, ...)` / `writeViteTarget(...)`                             | The Vite+ (`--target vite`) output helpers.      |

### `@deltabox/toolchain/template`

| Export                                                                          | Description                                                |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `loadTemplates(options)` / `collectSources(options)`                            | Resolve builtin/local/online sources into templates.       |
| `scaffoldTemplate(template, options)`                                           | Copy a template into a target directory, resolving tokens. |
| `addTemplateSource(cwd, source)` / `removeTemplateSource(cwd, key)`             | Manage `.dbx/toolchain/templates.json`.                    |
| `readTemplateRegistry` / `writeTemplateRegistry`                                | Read/write the template source registry.                   |
| `BUILTIN_TEMPLATES` / `loadLocalTemplates(root, idPrefix?)`                     | The offline templates.                                     |
| `readTemplateDir` / `readTemplateManifest` / `writeTemplateManifest`            | A local `template.json` directory.                         |
| `parseSourceSpec(spec, cwd?)` / `gitTemplate(source)` / `loadNpmTemplates(pkg)` | Online source parsing/loading.                             |

### `@deltabox/toolchain/providers`

| Export                      | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| `toolchainProviders()`      | Every registered provider with its actions resolved.  |
| `providerActions(provider)` | The default actions for a provider (one per command). |
| `viteProvider()`            | The Vite+ provider descriptor.                        |

```ts
import { toolchainProviders } from '@deltabox/toolchain/providers';
console.log(toolchainProviders().map(p => p.id));
```

### `@deltabox/toolchain/tsdown`

| Export                                                         | Description                                  |
| -------------------------------------------------------------- | -------------------------------------------- |
| `baseTsdownConfig`                                             | The shared tsdown base config.               |
| `createTsdownConfig(overrides?)` / `createPostBanner(options)` | Build a tsdown config / a post-build banner. |
| `cleanup(options?)` / `cleanupCommands()`                      | Remove build artifacts / the turbo cache.    |

### `@deltabox/toolchain/tsconfig`

| Export                                                                       | Description                                           |
| ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| `tsconfigSyncTask()`                                                         | The tsconfig sync task.                               |
| `tsconfigBaseTemplate` / `tsconfigDefaultTemplate` / `tsconfigBuildTemplate` | The base/default/build templates.                     |
| `renderTsconfigBase` / `renderTsconfigDefault` / `renderTsconfigBuild`       | Render the templates with replacements.               |
| `buildMonorepoTsconfig(options)` / `renderMonorepoTsconfig(options)`         | The monorepo root tsconfig with references + aliases. |
| `renderTsconfigTemplates(replacements?)`                                     | Render every template at once.                        |
| `generateTsconfigs(options)` / `runTsconfigCli(argv?)`                       | The tsconfig generator and its CLI.                   |

### `@deltabox/toolchain/changelog`

| Export                                                                 | Description                                          |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| `runChangelog(argv?)` / `main`                                         | Derive the bump and update the changelog + versions. |
| `runWorkflows(options)` / `resolveWorkflowId(name)`                    | Trigger generated GitHub workflows.                  |
| `renderWorkflow(id, options)` / `renderWorkflows(...)`                 | Render workflow YAML.                                |
| `renderCommitlintConfig(options?)` / `changelogSyncTask()`             | Commitlint config + the changelog sync task.         |
| `readCommits(range)` / `deriveBump(records)` / `buildSummary(records)` | Git commit reading, bump derivation and summaries.   |
| `renderChangelogEntry(...)` / `parseExistingChangelog(content)`        | Changelog entry rendering/parsing.                   |

### `@deltabox/toolchain/biome`

| Export                                                                  | Description                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| `biomeConfig` / `biomeVscodeSettings`                                   | The generic Biome config and recommended VS Code settings. |
| `renderBiomeConfig(replacements?, overrides?)` / `renderBiomeJson(...)` | Resolve tokens + merge overrides, then serialize.          |
| `mergeBiomeConfig(base, patch)` / `renderVscodeSettings(indent?)`       | Recursive merge and settings rendering.                    |
| `biomeSyncTask()`                                                       | The biome sync task (writes `biome.json`).                 |

### `@deltabox/toolchain/project`

| Export                                                                                       | Description                                        |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `createRootProjectFiles(ctx)` / `createMonorepoRootFiles(ctx)` / `createWorkspaceFiles(ctx)` | Scaffold files for each project kind.              |
| `generateProjectConfigs(options)`                                                            | Generate `dbx.config.ts` for projects missing one. |
| `renderToolchainConfig(ctx)` / `renderWorkspaceTsconfig(composite?)`                         | Render the tooling config / a workspace tsconfig.  |
| `renderTurboJson()` / `renderGitignore()`                                                    | Render `turbo.json` / `.gitignore`.                |
| `writeGeneratedFiles(files, cwd?)`                                                           | Write a `GeneratedFile[]`.                         |
| `projectCommands()`                                                                          | The `project:*` commands.                          |

## Logging

Every toolchain message goes through one level-aware logger, rendered with
[`@clack/prompts`](https://bombshell.dev/clack) (level symbols + guide). Use it
instead of `console.log` so output stays consistent and respects the config and
the CLI flags.

| Export / member                                   | Description                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `logger`                                          | The active singleton: `raw`, `debug`, `info`, `success`, `warn`, `error`, `level`, `colors`. |
| `createLogger(options)`                           | Create an independent logger (`level`, `color`, `name`).                                     |
| `setLogConfig(section)`                           | Apply the `logger` section from the loaded config.                                           |
| `setLogOverrides(options)`                        | Apply CLI overrides (win over the config). `configureLogger` is an alias.                    |
| `getLogOverrides()` / `getLogger()`               | Read the current overrides / the active instance.                                            |
| `LOG_LEVELS` / `isLogLevel` / `normalizeLogLevel` | The valid levels, most verbose first (`debug`, `info`, `warn`, `error`, `silent`).           |

```ts
import { createLogger, logger, setLogConfig, setLogOverrides } from '@deltabox/toolchain/shared';

setLogConfig({ level: 'debug', color: false, name: 'dbx' }); // from dbx.config.*
setLogOverrides({ level: 'warn' }); // from --log-level

logger.info('human message');
logger.success('done');
logger.error('failed');
logger.raw(JSON.stringify(payload)); // machine output: no prefix, no colour
```

Use `raw` for machine output (`--json`): it is never prefixed or decorated.
`logger.warn`/`error` write to stderr; `debug`/`info`/`success`/`raw` to stdout.
Messages that start with whitespace (indented continuations) are never prefixed.

This mirrors the [`logger` config section](/guide/config#logging) and the
`--log-level <level>` / `--no-color` [CLI flags](/guide/cli#global-flags), which
call `setLogConfig` / `setLogOverrides` under the hood.

## Examples

```ts
// Vite+ provider
import { resolveVp, runVp, resolveVpCommand, VP_COMMANDS } from '@deltabox/toolchain/vite';
await runVp(['check'], { cwd: process.cwd() });
resolveVpCommand('i'); // 'install'

// Migrations
import { detectMigrations, runMigration } from '@deltabox/toolchain/migrate';
for (const m of detectMigrations(process.cwd())) await m.run({ cwd: process.cwd(), write: true });

// Templates
import { loadTemplates, scaffoldTemplate } from '@deltabox/toolchain/template';
const [template] = await loadTemplates({ cwd: process.cwd() });
if (template) await scaffoldTemplate(template, { cwd: './out', tokens: { name: 'acme' } });

// Providers (what the editor reads)
import { toolchainProviders } from '@deltabox/toolchain/providers';
console.log(toolchainProviders().map(p => p.id));

// Config engine
import { createConfigEngine } from '@deltabox/toolchain/config';
```

## Registering commands

Packages export framework-agnostic `ToolchainCommand[]` descriptors; wire them onto
a commander program with `registerToolchainCommands` (this is how the bundled
`dbx` binary, and a consumer's own CLI, are assembled):

```ts
import { Command } from 'commander';

import { registerToolchainCommands } from '@deltabox/toolchain/cli';
import { configCommands } from '@deltabox/toolchain/config';

const program = new Command();
registerToolchainCommands(program, configCommands({ engine }));
await program.parseAsync();
```
