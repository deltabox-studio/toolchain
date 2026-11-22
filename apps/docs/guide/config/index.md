# Configuration guide

A project is configured in one of two ways:

- the recommended `dbx()` **Vite plugin** in `vite.config.*` (config inline, no
  `dbx.config.*` needed), or
- a standalone `dbx.config.ts` when the project does not use Vite.

Both can be combined: `dbx.config.*` is the base and the plugin options merge on
top. The `@deltabox/toolchain` settings live under the `toolchain` key:

```ts [dbx.config.ts]
import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: {
            type: 'monorepo-root',
            name: 'myapp',
            scope: '@org',
        },
        ci: {
            ci: true,
            changelog: {
                branches: { main: 'main', dev: 'dev' },
                commitlint: { scopes: ['api', 'web', 'deps'] },
            },
        },
        tsconfig: { refs: true },
        fmt: { vscode: true, oxc: { semi: true, singleQuote: true } },
        lint: { oxc: { ignorePatterns: ['dist/**'] } },
        vite: {
            test: { include: ['src/**/*.test.ts'] },
        },
        watch: { debounce: 150 },
    },
});
```

A `dbx.config.ts` can also host other dbx concerns alongside the `toolchain`
section.

Each section has its own guide: [Project](/guide/project), [CI +
Changelog](/guide/changelog/), [tsconfig](/guide/tsconfig),
[Formatting & linting](/guide/formatting),
[Vite+](/guide/vite), [Watch](/guide/watch), [Logger](/guide/logger) and
[Providers](/guide/providers).

## Where to start

- [Opt-in by presence](/guide/config/opt-in-by-presence) — which sections run, and
  how nested sections like `ci.changelog` and the individual workflows opt in.
- [Nested configs](/guide/config/nested-configs) — how a workspace config merges
  over its root.
- [`defineConfig`](/guide/config/defineconfig) — object, promise or callback.
- [Config file names](/guide/config/config-file-names) — the file names the
  loader probes.
- [Loader](/guide/config/loader) — the `toolchain.loader` tsconfig options,
  path aliases, `.js` → `.ts` imports and examples.
- [Hooks](/guide/config/hooks) — lifecycle hooks in a `.ts`/`.js` config.
- [Logging](/guide/config/logging) — the logger section and CLI overrides.
- [Providers](/guide/config/providers) — provider passthrough colour settings.
- [Vite+](/guide/config/vite) — the full Vite+ config and the generated shim.
- [Programmatic API](/guide/config/programmatic-api) — load + sync from code.

The generated, exhaustive section reference is [dbx.config](/config/reference).
