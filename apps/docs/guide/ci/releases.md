# Releases

The generated `ci.release` workflow (`release.yml`) opens a release PR whose body
is the **aggregated changelog**: every entry from the last released version up to
the latest one, not just the newest entry. So a release that skips versions
(eg. `v1.7.0` → `v1.7.8`) still documents `1.7.1`–`1.7.8` in one place.

The body is produced by `dbx changelog --release-body <version>`, which only
considers versions that actually appear in `CHANGELOG.md` (so unrelated
CI/calendar tags are ignored). For a first release, when there is no prior
version, it falls back to the newest changelog entry instead of the whole file.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        release: { pushBranches: ['main'] },
    },
}
```

The workflow is opt-in. Use [Workflow settings](/guide/ci/settings) to override
the job's extra steps/jobs or supply a fully hand-authored workflow. It can also
be a complete GitLab/Azure pipeline via `{ provider, workflow }`.

## Grouped release bodies

By default each release body stops at the previous released version. When a
project publishes prereleases (for example `3.0.0-beta.1` … `3.0.0-beta.16`
before `3.0.0`), the stable GitHub Release would only mention the changes since
the last beta. Set `release.group` to treat every version since the previous
**published** release as one version:

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
  when grouping is enabled; without grouping it keeps the newest-entry
  fallback.
- Missing tags are tolerated: if no released version can be found, grouping
  selects the entries above the newest match, or the whole changelog when none
  matches.

When `gh` is available and the repository has published releases, the boundary
comes from them (drafts are excluded); otherwise it falls back to the local tags
merged into `HEAD`. The command is read-only, so re-running it produces the same
body.

### Overrides

| Setting                      | Effect                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `release.group`              | Enable grouped release bodies. **Default `false`.**                                       |
| `release.includePrereleases` | Let a prerelease bound a stable release's body (only the changes since that beta).        |
| `release.since`              | Explicit lower boundary version/tag (eg. `v1.2.0`); a missing version falls back to auto. |

The same options are available as one-off CLI flags:

```sh
dbx changelog --release-body 3.0.0 --release-group
dbx changelog --release-body 3.0.0 --release-since v3.0.0-beta.1
dbx changelog --release-body 3.0.0 --no-release-group
```

`--release-group` wins over the config for that run, and `--no-release-group`
turns a configured grouping off (useful for debugging).

With `versioning.target: 'individual'`, the root `CHANGELOG.md` remains the
aggregate release body: it lists every pushed commit, while package changelogs
stay scoped to their own package and are not merged into the GitHub Release.
