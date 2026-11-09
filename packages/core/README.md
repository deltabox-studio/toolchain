# @deltabox/toolchain-core

Core runtime for dbx: loads dbx.config.* and the Vite plugin config, builds the project graph, runs sync tasks, manages manifests and watches inputs.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-core
# or: npm install -D @deltabox/toolchain-core
```

## Public API

The package root exports its public API. Included modules cover: config loading, the project graph, sync runner/tasks, manifests, watch mode, editor/gitignore/vscode helpers, reset and provider registry.

It is also available through the umbrella subpath `@deltabox/toolchain/core`.

## License

MPL-2.0 ? deltabox
