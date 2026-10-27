# Opt-in by presence

Every section under `toolchain` is **opt-in by presence**: the toolchain only
touches an area you actually ask for.

- Omit a section — that area is left completely alone.
- `section: true` — enable it with defaults (when the section has defaults).
- `section: false` — explicitly disable it.
- `section: { ...options }` — enable and configure it.

This applies to nested sections too. `ci` is opt-in, and every workflow inside it
(`ci.ci`, `ci.release`, `ci.issues`, `ci.changelog`, `ci.sync`) is opt-in as
well: omit a workflow (or set it to `false`) and the toolchain will not generate
or manage its file. Setting `ci: false` or `ci: { enabled: false }` disables the
whole section, including every nested workflow and the changelog pipeline.

The same rule backs `ci.changelog`: it is only managed when you declare it, and
`ci.changelog: false` (or `enabled: false`) disables both its workflow and the
changelog pipeline.

Helpers `sectionEnabled(section)` and `sectionConfig(section)` implement this and
are exported for programmatic use.

The old top-level `changelog` section is deprecated and rejected by the loader;
see [Migrating from `toolchain.changelog`](/guide/changelog/#migrating-from-toolchainchangelog).
