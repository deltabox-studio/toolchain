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

## Detection

With `runtime: 'auto'` the generator reads `package.json`:

- a `vitepress build` script is a **static** site
  (`docs/.vitepress/dist`);
- a `bun build`/`bun ...` start script is a **Bun** server;
- a `start` script is a **Node** server;
- a `vp build` script without `start` is a **static** app;
- otherwise it falls back to a **Node** server.
