# @deltabox/toolchain-config

Zod- and env-backed configuration engine: parse environment variables, walk schemas, resolve typed config and generate .env, types, markdown, JSON and CLI output.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-config
# or: npm install -D @deltabox/toolchain-config
```

## Public API

The package root exports its public API. Included modules cover: collectors, env parsing, schema walking, config resolution/JSON generation, and the .env/types/markdown/JSON/CLI generators.

It is also available through the umbrella subpath `@deltabox/toolchain/config`.

## License

MPL-2.0 ? deltabox
