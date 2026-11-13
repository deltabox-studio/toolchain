# @deltabox/toolchain-pack

Build-pack base configuration (tsdown), workspace aliases and cleanup commands used by @deltabox/toolchain.

The workspace is named `pack` after Vite+'s `pack` field, but the underlying bundler remains tsdown, so the public helper names (`baseTsdownConfig`, `createTsdownConfig`) are unchanged.

Part of **deltabox toolchain** - a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.

## Install

```sh
yarn add -D @deltabox/toolchain-pack
# or: npm install -D @deltabox/toolchain-pack
```

## Public API

The package root exports its public API. Included modules cover: the shared `baseTsdownConfig`, workspace aliases, post-banner helpers, cleanup commands and the absolute-`node_modules` leak reporter.

The base config externalizes npm dependencies in the JS bundle and keeps declaration imports **as written** (`deps.dts.neverBundle: true`). Emitted `.d.ts` files therefore reference bare package specifiers (`import ... from "type-fest"`) instead of build-machine absolute `node_modules` paths. Any package used in public types must be declared in `dependencies` (or `peerDependencies`).

A Rolldown leak reporter (`createNodeModulesLeakReporter`) is included by default. It scans emitted JS, declaration and textual asset chunks and fails the build when an absolute `node_modules` path slips through. Configure it as the third `createTsdownConfig` argument:

```ts
createTsdownConfig(overrides, banner, {
    nodeModulesLeakReporter: {
        level: 'warn', // error (default) | warn | info | silent
        when: 'writeBundle', // generateBundle | writeBundle (default) | closeBundle
    },
    // or: nodeModulesLeakReporter: false
});
```

`warn`/`info` respect the effective tsdown/rolldown log level; `error` always fails the build. `writeBundle` analyzes after every `generateBundle` hook; use `closeBundle` when a later plugin rewrites output in `writeBundle` (it reads the emitted files from disk, and in watch mode runs when the watcher closes).

It is also exported as a standalone plugin:

```ts
import { createNodeModulesLeakReporter } from '@deltabox/toolchain-pack';

export default {
    plugins: [createNodeModulesLeakReporter({ level: 'warn', when: 'closeBundle' })],
};
```

It is also available through the umbrella subpath `@deltabox/toolchain/pack`.

## License

MPL-2.0 ? deltabox
