# Docker

`@deltabox/toolchain-docker` generates a deployable, multi-stage `Dockerfile`, a
`.dockerignore` and an optional `docker-compose.yml`. Containerization is
**opt-in**: nothing is written unless you ask for it.

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

## Managed Dockerfile

Enable the `docker` section to let `dbx sync` manage the artifacts from
`dbx.config.*` (or the `dbx()` plugin):

```ts
toolchain: {
    docker: {
        image: 'acme/api', // default: the project name
        tag: 'latest',
        port: 3000, // default 3000, or 8080 for static sites
        compose: true, // also write docker-compose.yml
    },
}
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
| `compose`         | `false`                     | Write `docker-compose.yml`.                    |
| `healthcheck`     | `true`                      | Add an HTTP `HEALTHCHECK`.                     |
| `healthcheckPath` | `/`                         | Path the healthcheck requests.                 |
| `dockerfile`      | `Dockerfile`                | Dockerfile file name.                          |
| `dockerignore`    | `true`                      | Write `.dockerignore`.                         |

The task applies to single projects and monorepo workspaces (not a monorepo
root) and marks the files as unformatted managed files, so `dbx sync --check`
compares the generated content directly.

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

With `runtime: 'auto'` the task reads `package.json`:

- a `vitepress build` script is a **static** site
  (`docs/.vitepress/dist`);
- a `bun build`/`bun ...` start script is a **Bun** server;
- a `start` script is a **Node** server;
- a `vp build` script without `start` is a **static** app;
- otherwise it falls back to a **Node** server.
