# @deltabox/toolchain-tsconfig

TypeScript config templates plus the tsconfig generator with path-alias, project-reference and include/exclude wiring.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-tsconfig
# or: npm install -D @deltabox/toolchain-tsconfig
```

## Public API

The package root exports its public API. Included modules cover: tsconfig templates and generation (paths, references, include/exclude), `extends` resolution (including remote `http(s)` extends chains), overrides, snapshots and the sync task.

It is also available through the umbrella subpath `@deltabox/toolchain/tsconfig`.

## License

MPL-2.0 © deltabox
