---
layout: home

hero:
    name: deltabox toolchain
    text: One toolchain for the whole repo
    tagline: Scaffold projects, generate configs, manage tsconfigs, changelogs and CI, and run Vite+
    image:
        src: /logo/logo.svg
        alt: deltabox toolchain
    actions:
        - theme: brand
          text: Get Started
          link: /guide/
        - theme: alt
          text: Configuration
          link: /config/reference
        - theme: alt
          text: GitHub
          link: https://github.com/deltabox-studio/toolchain

features:
    - icon: 🛠️
      title: Config-driven
      details: Configure everything from a single configuration file.
    - icon: ⚙️
      title: Config generator
      details: Define your config once, and generate .env.example, JSON Schema, markdown, TS types and CLI flags from your schemas. No config docs to drift.
    - icon: ⚡
      title: Vite / Vite+ plugin
      details: Drive dbx from vite.config.ts with the dbx() plugin. Works with Vite and Vite+.
    - icon: 📦
      title: Changelogs & CI
      details: Automatic changelog & version bump API, and GitHub workflows for CI, changelog, release and issues.
    - icon: 📐
      title: tsconfig generation
      details: Workspace tsconfig.json files with path aliases and project references, generated from one config.
    - icon: 🔌
      title: Providers
      details: Wire external toolchains behind one CLI.
    - icon: 📄
      title: Templates
      details: Offline (builtin + local template.json dirs) and online (npm/git) templates.
    - icon: 🚚
      title: Migrations
      details: Migrate Biome, Prettier, ESLint or Dprint onto Oxc (Oxfmt/Oxlint).
    - icon: 💻
      title: Editor first
      details: A VS Code extension to sync, scaffold, run workflows, run commands and pick templates.
    - icon: 🏢
      title: Monorepo aware
      details: Project graph, workspace tsconfigs, dependency-ordered tasks, and per-workspace files.
    - icon: 🔄
      title: Sync projects
      details: Sync your entire project so workspaces, docs and CI are always up-to-date.
---
