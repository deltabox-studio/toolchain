# Docker

`@deltabox/toolchain-docker` generates a deployable, multi-stage `Dockerfile`, a
`.dockerignore` and a `docker-compose.yaml`. Containerization is **opt-in** and
happens only when you scaffold: the files are a starting point, not
`dbx sync`-managed artifacts, so you can edit them freely afterwards.

```sh
# Add Docker artifacts to a new project
dbx create --template express --name api --containerize

# Or scaffold with the project command
dbx project:init --name api --containerize
```

In VS Code, **Create from template…** asks _Containerize with Docker?_. The
setting `deltabox.toolchain.containerizeTemplates` supplies the default and is
used by the curated **Scaffold** flow. Programmatically, pass
`containerize: true` to `scaffoldTemplate()`.

Every scaffold gets `Dockerfile`, `.dockerignore` and `docker-compose.yaml` for
local development (`docker compose up --build`).

## Programmatic API

`dockerFiles()` renders the artifacts (without writing), and
`writeDockerFiles()` writes them to a project:

```ts
import { dockerFiles, writeDockerFiles } from '@deltabox/toolchain/docker';

const files = dockerFiles({
    cwd: process.cwd(),
    image: 'acme/api',
    tag: 'latest',
    port: 3000,
});

const written = writeDockerFiles({
    cwd: process.cwd(),
    compose: true,
    force: true, // overwrite existing artifacts
});
```

| Option            | Default                     | What it does                                   |
| ----------------- | --------------------------- | ---------------------------------------------- |
| `image`           | project name                | OCI image name.                                |
| `tag`             | `latest`                    | Image tag.                                     |
| `port`            | `3000` / `8080`             | Port the runtime image exposes.                |
| `runtime`         | `auto`                      | `node`, `static`, `bun`, or detect.            |
| `entry`           | `dist/index.js`             | Built server entry for `node`/`bun` runtimes.  |
| `output`          | `dist`                      | Build output directory (`static` copies this). |
| `nodeVersion`     | `engines.node` or `22`      | Node.js version for non-Vite+ images.          |
| `baseImage`       | Vite+/Bun/Node image        | Override the build-stage image.                |
| `runtimeImage`    | Debian/Bun/nginx/Node image | Override the runtime image.                    |
| `user`            | `nobody` / `node` / `bun`   | Runtime user.                                  |
| `compose`         | `false`                     | Also render `docker-compose.yaml`.             |
| `healthcheck`     | `true`                      | Add an HTTP `HEALTHCHECK`.                     |
| `healthcheckPath` | `/`                         | Path the healthcheck requests.                 |
| `dockerfile`      | `Dockerfile`                | Dockerfile file name.                          |
| `dockerignore`    | `true`                      | Render `.dockerignore`.                        |

`writeDockerFiles()` does not overwrite existing files unless `force: true`
(scaffolding passes it for a fresh project). There is no `docker` config section
and no sync task: the generated files are yours to maintain.

## Images

- **Vite+ projects** build with
  `ghcr.io/voidzero-dev/vite-plus:latest`, install with `vp install`, build with
  `vp build`, and copy the resolved Node.js binary into the runtime stage.
- **Bun projects** use `oven/bun:1` to build and `oven/bun:1-slim` to run.
- **Other Node projects** use `node:<version>-bookworm-slim`.
- **Static sites** copy the build output into
  `nginxinc/nginx-unprivileged:alpine`, so the container runs as a non-root
  user on port `8080`.

Server images run as a non-root user and get a `HEALTHCHECK` that requests
`http://127.0.0.1:<port><healthcheckPath>`.

## COPY sources and installs

The dependency-install stage copies only sources that exist when the Dockerfile
is generated: `package.json` plus the project's lockfile/workspace files
(`yarn.lock`/`.yarnrc.yml`, `pnpm-lock.yaml`/`pnpm-workspace.yaml`,
`package-lock.json`, `bun.lock`/`bun.lockb`). A Vite+ project also copies an
existing `.node-version` before `vp install`, so Vite+ selects the same Node.js
version in the image. No lockfile is assumed, and a missing lockfile is never
`COPY`ed, so a fresh scaffold builds.

The generated `.dockerignore` matches dependencies and build output at any
depth (`**/node_modules`, `**/dist`, the configured output directory, ...), so
nested workspace copies are excluded from the build context too.

Yarn Plug'n'Play projects do not get `node_modules`. Their runtime image copies
the generated `.pnp.cjs` (or `.pnp.js`), an optional `.pnp.loader.mjs`, and
`.yarn`, then starts Node with `--require ./.pnp.cjs` (and
`--experimental-loader` when the loader exists).

The declared package manager is the single source of truth: `packageManager` in
`package.json` (or the `packageManager` option) drives both the copied lockfiles
and the `RUN` command. A Bun-runtime project with no declared manager installs
with Bun; otherwise the declared manager wins, so `yarn.lock` is never paired
with `bun install`. When a Bun-runtime project declares yarn/pnpm/npm,
dependencies install in a `node:<version>` `deps` stage and the Bun image only
builds (the official Bun image has no npm/corepack). Without a lockfile the
install runs without a frozen flag (`yarn install`, `pnpm install`,
`npm install`, `bun install`, `vp install`).

## Detection

With `runtime: 'auto'` the generator reads `package.json`:

- a `vitepress build` script is a **static** site
  (`docs/.vitepress/dist`);
- a `bun build`/`bun ...` start script is a **Bun** server;
- a `start` script is a **Node** server;
- a `vp build` script without `start` is a **static** app;
- otherwise it falls back to a **Node** server.
