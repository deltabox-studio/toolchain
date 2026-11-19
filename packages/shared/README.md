# @deltabox/toolchain-shared

Shared helpers, types and the replacement/template engine used by the @deltabox/toolchain packages.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-shared
# or: npm install -D @deltabox/toolchain-shared
```

## Public API

The package root exports its public API. Included modules cover: logger, file-system/ignore/string/object helpers, template and replacement engines, toolchain types/sections, provider types and Vite defaults.

It is also available through the umbrella subpath `@deltabox/toolchain/shared`.

## License

MPL-2.0 © deltabox
