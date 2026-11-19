# @deltabox/toolchain-mcp

Model Context Protocol server and installer exposing the dbx toolchain APIs and skills over JSON-RPC stdio.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-mcp
# or: npm install -D @deltabox/toolchain-mcp
```

## Public API

The package root exports its public API. Included modules cover: the JSON-RPC stdio server, MCP tool definitions and the installer for Claude, Codex, VS Code, OpenCode, Pi and custom clients.

It is also available through the umbrella subpath `@deltabox/toolchain/mcp`.

## License

MPL-2.0 © deltabox
