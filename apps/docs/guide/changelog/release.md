# Release bodies

`changelog.release` controls the body produced by
`dbx changelog --release-body <version>`. That body is the aggregated changelog
for a release: the entries from the previous published version up to the
requested one, not just the newest entry.

```sh
dbx changelog --release-body 3.0.0
```

The command prints the body to stdout and writes nothing. The generated release
workflow uses the same command for the release PR and the GitHub Release; see
[Releases](/guide/ci/releases) for the workflow itself.

The setting is available on both changelog sections:

- `ci.changelog.release` — CI and manual runs that inherit the CI config.
- `toolchain.changelog.release` — manual `dbx changelog`, the VS Code actions
  and the programmatic API.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        changelog: {
            release: { group: true },
        },
    },
}
```

## How the body is built

- Only versions present in the root `CHANGELOG.md` can bound the body. Unrelated
  tags (calendar versions, package tags for another workspace) are ignored.
- Version headings are never printed. The output contains only the bodies.
- When an entry has `<!-- release:start -->` / `<!-- release:end -->` markers,
  only the content inside them is used.
- Equal `<details>` summary groups from several versions are merged, and repeated
  `### Package changes` footers are collapsed to the newest one (the cumulative
  diff).
- An empty result falls back to `Release <version>`.
- The command is read-only, so running it twice produces the same body.

With `versioning.target: 'individual'`, the root `CHANGELOG.md` remains the
aggregate release body. Package changelogs stay scoped to their own package and
are not merged into the GitHub Release body.

## Grouped release bodies

By default the body stops at the previous released version. When a project
publishes prereleases (for example `3.0.0-beta.1` ... `3.0.0-beta.16` before
`3.0.0`), the stable GitHub Release would only mention the changes since the last
beta. Set `release.group` to treat every version since the previous **published**
release as one version:

```ts [dbx.config.ts]
toolchain: {
    ci: {
        changelog: {
            versioning: { target: 'individual', prerelease: 'beta' },
            release: { group: true },
        },
    },
}
```

- A **stable** release skips prerelease versions when it picks the boundary, so
  all betas since the last stable release are merged into one body. Version
  headings and duplicate section groups are never repeated; the newest
  `### Package changes` footer wins because it already covers the whole range.
- A **prerelease** release still stops at the previous prerelease, so each beta
  lists only its own changes instead of repeating the whole cycle.
- A **first release** (no published release yet) groups every changelog entry
  when grouping is enabled; without grouping it keeps the newest-entry fallback.
- Missing tags are tolerated: if no released version can be found, grouping
  selects the entries above the newest match, or the whole changelog when none
  matches.

The boundary comes from published GitHub Releases when `gh` is available and the
repository has at least one (drafts are excluded); otherwise it falls back to the
local tags merged into `HEAD`.

## Options

| Setting                      | Effect                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `release.group`              | Enable grouped release bodies. **Default `false`.**                                       |
| `release.includePrereleases` | Let a prerelease bound a stable release's body (only the changes since that beta).        |
| `release.since`              | Explicit lower boundary version/tag (eg. `v1.2.0`); a missing version falls back to auto. |

```ts [dbx.config.ts]
toolchain: {
    ci: {
        changelog: {
            release: {
                group: true,
                // Let a beta stop the body instead of grouping every beta.
                includePrereleases: true,
                // Or skip discovery and start after this version.
                since: 'v3.0.0-beta.1',
            },
        },
    },
}
```

`since` accepts a version or tag (`1.2.0`, `v1.2.0`, `@scope/pkg@1.2.0`). When
it does not name a version in the changelog, automatic discovery is used.

## CLI flags

The options can be overridden for one run:

```sh
dbx changelog --release-body 3.0.0 --release-group
dbx changelog --release-body 3.0.0 --release-since v3.0.0-beta.1
dbx changelog --release-body 3.0.0 --release-include-prereleases
dbx changelog --release-body 3.0.0 --no-release-group
```

`--release-group` wins over the config for that run, and `--no-release-group`
turns a configured grouping off (useful for debugging).

## Release workflow

The generated release workflow (`release.yml`) runs
`dbx changelog --release-body "$version"` for both the release PR body and the
GitHub Release. It therefore picks up `changelog.release` from the config
automatically; no workflow change is needed after enabling grouping. See
[Releases](/guide/ci/releases) for the workflow options and the release PR flow.
