---
layout: home

hero:
    name: deltabox toolchain
    text: A superset of Vite+ with rich extras
    tagline: Project synchronization, config generator, tsconfig management, MCP server, CI and changelog automation, providers, catalogs, VS Code extension, and more.
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
    - icon: 🔄
      title: Project synchronization
      details: Sync your entire project so workspaces, configs, docs and CI are always up-to-date.
    - icon: ⚙️
      title: Config generator
      details: Define your config once, and generate .env.example, JSON Schema, markdown, TS types and CLI flags from your schemas. No config docs to drift.
    - icon: 🤖
      title: MCP server
      details: Expose the toolchain to AI agents over MCP, with one-command installs for Claude, Codex, VS Code, OpenCode and more.
    - icon: 📐
      title: tsconfig management
      details: Workspace tsconfig.json files with path aliases and project references, generated and kept in sync from one config.
    - icon: 📦
      title: Changelogs & CI
      details: Automatic changelog & version bump API, and GitHub workflows for CI, changelog, release and issues.
    - icon: 💻
      title: VS Code extension
      details: Sync, scaffold, run workflows, run commands and pick templates without leaving the editor.
    - icon: ⚡
      title: Vite / Vite+ plugin (optional)
      details: Drive dbx from vite.config.ts with the dbx() plugin, or use it standalone. Works with Vite and Vite+.
    - icon: 🔌
      title: Providers
      details: Wire external toolchains behind one CLI.
    - icon: 🗂️
      title: Catalogs
      details: Manage package catalogs for Yarn, pnpm and Bun, and keep the root dependencies in sync.
    - icon: 📄
      title: Templates
      details: Offline (builtin + local template.json dirs) and online (npm/git) templates.
    - icon: 🚚
      title: Migrations
      details: Migrate Biome, Prettier, ESLint, Dprint or Oxc configs into dbx.config (or onto Oxc).
    - icon: 🏢
      title: Monorepo aware
      details: Project graph, workspace tsconfigs, dependency-ordered tasks, and per-workspace files.
    - icon: 🛠️
      title: Config-driven
      details: Configure everything from a single configuration file.
---
