# @deltabox/toolchain-migrate

Pluggable migrations of Biome, ESLint, Prettier and dprint tooling to Oxfmt and Oxlint, mapping formatter/linter rules into dbx config.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-migrate
# or: npm install -D @deltabox/toolchain-migrate
```

## Public API

The package root exports its public API. Included modules cover: migration detection, Biome/ESLint/Prettier/dprint -> Oxc mapping, check/apply runners and the Vite target helpers.

It is also available through the umbrella subpath `@deltabox/toolchain/migrate`.

## Online migrations

ESLint JSON configs are mapped locally. Flat (`eslint.config.js`) and other
JS configs need `dbx migrate --online --write`, which runs `@oxlint/migrate` so
the config can be evaluated in Node.

## License

MPL-2.0 © deltabox
