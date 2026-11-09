# @deltabox/toolchain-template

Custom project, tooling and pipeline template registry with builtin, local and online (npm/git/Vite+) sources.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-template
# or: npm install -D @deltabox/toolchain-template
```

## Public API

The package root exports its public API. Included modules cover: builtin/local/online template registries, template scaffolding and CLI commands.

It is also available through the umbrella subpath `@deltabox/toolchain/template`.

## License

MPL-2.0 ? deltabox
