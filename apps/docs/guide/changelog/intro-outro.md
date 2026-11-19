# Intro and outro text

`toolchain.changelog.intro` and `toolchain.changelog.outro` add custom text to the
newest changelog entry. They are opt-in: when the section is absent or an entry
is disabled, nothing is added. `ci.changelog` inherits the same options.

Each setting accepts one entry or an array (`Arrayable`). An entry contains:

| Field     | Description                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| `content` | The text to insert. Mutually exclusive with `file`.                                                            |
| `file`    | A file whose contents are inserted (relative to the repo root or absolute). Mutually exclusive with `content`. |
| `target`  | A workspace path relative to the repo root, `.` for the root, or a glob like `apps/*`.                         |
| `include` | Only apply to workspaces whose repo-relative directory matches these globs (tsconfig-style include).           |
| `exclude` | Skip workspaces whose repo-relative directory matches these globs.                                             |
| `enabled` | Set `false` to skip the entry (default `true`).                                                                |

Intro text is placed before the version body; outro text is appended after it.
Entries are applied in config order, and multiple matching entries are joined
with a blank line. Workspaces outside `ci.changelog.versioning.workspaces` (or
the default workspace fallback) are skipped.

```ts
export default defineConfig({
    toolchain: {
        changelog: {
            intro: [
                { target: '.', content: '> **Pre-release:** APIs may change.' },
                { include: 'apps/*', file: 'docs/CHANGELOG.intro.md' },
            ],
            outro: {
                target: 'packages/ui',
                content: '_Thanks to everyone who contributed!_',
            },
        },
    },
});
```

The same target selector is reused by the scoped versioning options
(`prerelease`, `bump`, `allowOverBump`, `commit`, `provider`); see
[Versioning](/guide/changelog/versioning#targeted-options).

### CLI flags

You can add an intro/outro without editing the config:

`sh
dbx changelog --intro "> **Beta:** APIs may change." --outro-file CHANGELOG.outro.md
dbx changelog --intro-file CHANGELOG.intro.md --outro "Thanks to all contributors!"
`

Flags are appended to the configured entries (config is still loaded from the
dbx() Vite plugin or dbx.config.*). The intro is rendered below the version
heading.
