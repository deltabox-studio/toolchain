# @deltabox/toolchain-changelog

Conventional-Commits changelog and versioning pipeline with commitlint, changelog formatting/rendering and CI workflow templates.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-changelog
# or: npm install -D @deltabox/toolchain-changelog
```

## Public API

The package root exports its public API. Included modules cover: commit reading and bump derivation, changelog parsing/reformatting, entry rendering, versioning, workflow generation and the `runChangelog` pipeline.

It is also available through the umbrella subpath `@deltabox/toolchain/changelog`.

## License

MPL-2.0 ? deltabox
