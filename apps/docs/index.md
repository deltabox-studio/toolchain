---
layout: home

hero:
    name: deltabox toolchain
    text: One toolchain for the whole repo
    tagline: Scaffold projects, generate configs, manage tsconfigs, changelogs and CI, and run Vite+
    image:
        src: /toolchain.svg
        alt: deltabox toolchain
    actions:
        - theme: brand
          text: Get Started
          link: /guide/
        - theme: alt
          text: Configuration
          link: /config/reference

features:
    - title: Config-driven
      details: opt-in sections in dbx.config.ts or CLI (biome, tsconfig, changelog, templates, vite, ...). Define a section to enable it; nothing is touched otherwise.
    - title: Config generator
      details: Define your config once, and generate .env.example, a JSON Schema, a markdown reference, TS types and CLI flags from your schemas. No config docs to drift.
    - title: Vite / Vite+ plugin
      details: Drive dbx from vite.config.ts with the dbx() plugin. Works with Vite and Vite+.
    - title: Changelogs & CI
      details: Automatic changelog & version bump API, and GitHub workflows for CI, changelog, release and issues.
    - title: tsconfig generation
      details: Workspace tsconfig.json files with path aliases and project references, generated from one config.
    - title: Providers
      details: Wire external toolchains behind one CLI. Vite+ ships as a provider.
    - title: Templates
      details: Offline (builtin + local template.json dirs) and online (npm/git/Vite+) templates, creatable from the CLI or the VS Code extension.
    - title: Migrations
      details: Move Biome, Prettier, ESLint or Dprint onto Ox (Oxfmt/Oxlint) with a pluggable migration engine.
    - title: Editor first
      details: A VS Code extension to sync, scaffold, run workflows, run Vite+ or other provider commands and pick templates.
    - title: Monorepo aware
      details: Project graph, workspace tsconfigs, dependency-ordered tasks, and per-workspace files.
    - title: Sync projects
      details: Sync your entire project so workspaces, docs and CI are always up-to-date.
---
