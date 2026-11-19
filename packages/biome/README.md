# @deltabox/toolchain-biome

Biome configuration and VS Code settings templates, plus merge helpers and the Biome sync task for @deltabox/toolchain.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-biome
# or: npm install -D @deltabox/toolchain-biome
```

## Public API

The package root exports its public API. Included modules cover: `biomeSyncTask`, `biomeConfig`, `biomeVscodeSettings`, merge helpers (`mergeBiomeConfig`, `resolveBiomeArray`, `removeBiomeEntry`) and renderers.

It is also available through the umbrella subpath `@deltabox/toolchain/biome`.

## License

MPL-2.0 © deltabox
