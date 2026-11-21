# Package scripts

`dbx` writes files, not your `package.json` — but a few scripts are worth
standardizing, because the toolchain's formatting/linting and task running both
go through **Vite+**. Any bare `dbx <command>` that matches a Vite+ command is
forwarded straight to it (`dbx fmt`, `dbx run -r build`, `dbx dev`), so a project
only needs the one `dbx` command. This page shows the recommended root scripts
and how to move an existing Biome + Turbo project onto them.

## Recommended scripts

The repo root `package.json`:

```json [package.json]
{
    "scripts": {
        "fmt": "dbx fmt",
        "lint": "dbx lint --fix",
        "check": "dbx check",
        "build": "dbx run -r build",
        "typecheck": "dbx run -r typecheck",
        "test": "dbx run -r test",
        "dbx:sync": "dbx sync",
        "dbx:watch": "dbx watch",
        "commitlint": "commitlint",
        "postinstall": "vp hooks enable"
    }
}
```

| Script                         | What it does                                                    |
| ------------------------------ | --------------------------------------------------------------- |
| `fmt` / `lint` / `check`       | Oxfmt / Oxlint across the repo (`check` = format check + lint). |
| `build` / `typecheck` / `test` | Runs the task in every workspace, in dependency order.          |
| `dbx:sync` / `dbx:watch`       | Regenerate the managed files / re-sync on change.               |
| `commitlint` / `postinstall`   | Conventional Commits + the Vite+ hook dispatcher.               |

Notes:

- A bare command that names a Vite+ command is forwarded to Vite+ (`vp`) — eg.
  `dbx fmt`, `dbx dev`, `dbx run -r build`, `dbx add zod` (Vite+ aliases too).
  Built-in commands win, so `dbx migrate` is the toolchain's migration — use
  `dbx vite migrate` for Vite+'s. The explicit `dbx vite <command>` passthrough
  always works.
- Vite+ resolves from the **repo root**, so `fmt`/`lint` live there — keep
  them out of the individual workspaces.
- `dbx run -r <task>` runs a task in every workspace package in dependency order.
  A task is either a `package.json` script or a `vite.config.ts` `run.tasks`
  entry. For long-running processes use `dbx run -r --parallel dev`.
- `dbx` is the toolchain binary, so `yarn dbx <cmd>` (eg. `yarn dbx sync`) works
  even without a script; the `dbx:*` aliases are just for discoverability.

When `ci.changelog` is enabled, `dbx sync` writes a `commit-msg` hook that runs
commitlint, so commits are linted locally as well as in CI. On a Vite+ project it
writes the project-owned `.vite-hooks/commit-msg`; activate the dispatcher on
install with `vp hooks enable` (or `vp config`, which also wires agent
integration). Projects without Vite+ keep the husky fallback
(`.husky/commit-msg` with `postinstall: husky`). Hook scripts have no extension,
so on Windows add `.vite-hooks/* text eol=lf` (or the husky equivalent) to
`.gitattributes` — a trailing CR silently breaks the hook.

To check staged files before a commit, add a project-owned
`.vite-hooks/pre-commit` that runs `vp staged`, and configure the checks in the
root `vite.config.ts`:

```ts [vite.config.ts]
staged: {
    '*': 'vp check --fix',
},
```

`vp staged` bundles lint-staged and requires Node.js ≥ 22.22.1 (or ≥ 24.11.0).
`vp hooks enable` only manages the dispatcher; it never overwrites project-owned
hooks such as `commit-msg` and `pre-commit`.

## Vite+ commands with the `dbx()` plugin

When the project uses the `dbx()` Vite plugin (`vite.config.ts`), call Vite+
directly for the toolchain commands:

```json [package.json]
{
    "scripts": {
        "dev": "vp dev",
        "build": "vp build",
        "check": "vp check",
        "test": "vp test",
        "dbx:sync": "dbx sync"
    }
}
```

`vp fmt`, `vp lint`, `vp run -r build` and the rest of the Vite+ commands work
from the repo root; `dbx` still owns `sync`, `watch`, `changelog` and the other
non-Vite+ commands. `dbx fmt` / `dbx lint` remain the portable form — they route
to the detected formatter/linter when a project is not on Vite+.

See Vite+ [Built-in commands vs
scripts](https://viteplus.dev/guide/run#built-in-commands-vs-scripts) for which
commands are built in and which run `package.json` scripts.

## Migrate an existing project

1. Add the toolchain + Vite+, and drop what they replace:

    ```diff
    -    "@biomejs/biome": "catalog:",
    -    "turbo": "^2.11.2",
    +    "@deltabox/toolchain": "^1.2.3",
    +    "vite-plus": "^1.2.0",
    ```

2. Fold the Biome config into a root `vite.config.ts`:

    ```sh
    dbx migrate --from biome --target vite --write
    ```

    Or, if the project uses `dbx.config.ts`, author the Vite+ config there under
    `toolchain.vite`. `dbx sync` then writes the root `vite.config.ts` shim (see
    [Vite+](/guide/config/vite)). `dbx migrate --from vite --write` folds an
    existing hand-written `vite.config.ts` in.

3. Replace the scripts (see the tables below), then delete `biome.json` and
   `turbo.json`.

4. Add a `dbx.config.ts` and sync the managed files:

    ```sh
    dbx sync
    ```

5. Verify — this is what CI runs:

    ```sh
    dbx sync --check
    yarn build
    ```

### Biome → Oxc

| Before                   | After            |
| ------------------------ | ---------------- |
| `biome format --write .` | `dbx fmt`        |
| `biome check --fix .`    | `dbx lint --fix` |
| `biome.json`             | `vite.config.ts` |

Remove `@biomejs/biome`, delete `biome.json`, and drop any per-workspace
`fmt`/`lint` scripts.

### Turbo → Vite Task

| Before            | After                                      |
| ----------------- | ------------------------------------------ |
| `turbo build`     | `dbx run -r build`                         |
| `turbo typecheck` | `dbx run -r typecheck`                     |
| `turbo test`      | `dbx run -r test`                          |
| `turbo dev`       | `dbx run -r --parallel dev`                |
| `turbo.json`      | (optional) `run.tasks` in `vite.config.ts` |

Remove `turbo` and `turbo.json`. Ordering comes from each package's
`package.json` dependencies, so no `turbo.json` graph is needed.

## Per-workspace tasks

Each package declares `build`, `typecheck` and `test` in its own `vite.config.*`
(or `dbx.config.*`) with explicit cache input/output, so `dbx run` reports cache
hits (a `package.json` script cannot carry cache config). Use the Vite+ commands
rather than the individual tools:

```ts [packages/<pkg>/vite.config.ts]
import { defineConfig } from 'vite-plus';

export default defineConfig({
    run: {
        tasks: {
            build: {
                command: 'vp pack',
                cache: { input: [{ auto: true }, '!dist/**'], output: ['dist/**'] },
            },
            test: {
                command: 'vp test run',
                cache: { input: [{ auto: true }], output: [] },
            },
        },
    },
});
```

See the [Monorepo guide](/guide/monorepo) for the full task setup,
[Migrations](/guide/migrations/) for the `dbx migrate` reference, and
[Providers (Vite+)](/guide/providers) for the `dbx vite` passthrough.
