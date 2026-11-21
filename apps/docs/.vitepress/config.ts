import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import AutoSidebar from 'vite-plugin-vitepress-auto-sidebar';
import { type DefaultTheme, defineConfig } from 'vitepress';
import carbonThemeBaseConfig from 'vitepress-carbon/config';
import { withFolderTree } from 'vitepress-plugin-folder-tree';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';
import llmstxt from 'vitepress-plugin-llms';

import pkg from '../../../package.json';

const CURRENT_YEAR = new Date().getFullYear();

const DESCRIPTION =
    "All-in-one development toolchain that let's you scaffold projects, generate and manage configs, tsconfigs, custom templates, syncing, changelogs, CI, Vite+, migrations, and more.";

/** The prose `llms.txt` opens with, before the generated table of contents. */
const LLMS_DETAILS = [
    '> If `https://toolchain.deltabox.studio` is unavailable, the same documentation is ' +
        'available in the repository at ' +
        '<https://github.com/deltabox-studio/toolchain/tree/main/apps/docs> (source Markdown).',
    '',
    'This file is a concise, link-first overview. For the **full** documentation in a ' +
        'single file, see [`llms-full.txt`](https://toolchain.deltabox.studio/llms-full.txt).',
    '',
    '**How it works** — `@deltabox/toolchain` is a config-driven toolchain:',
    '',
    '- **One config.** `dbx.config.ts` exports `{ toolchain: { ...sections } }`; every section is opt-in by presence (`section: true` uses defaults, omit it to leave that area untouched).',
    '- **Sync.** `dbx sync` runs each enabled section and writes the managed files, tracked in `.dbx/toolchain/manifest.json` (the last-sync time lives in the gitignored `.dbx/toolchain/timestamps.json`); `dbx sync --check` is the CI gate. `dbx sync --recursive` syncs every discovered project in dependency order.',
    '- **Nested configs.** A non-root `dbx.config.*` only inherits sections it explicitly enables (`fmt`, `lint`, `biome`, `changelog`, `catalogs`, `logger`); `project` metadata is inherited except its identity fields. `ci`, `tsconfig`, `loader`, `templates`, `registry`, `watch`, `providers`, `vite` and `hooks` are never inherited. Configless projects are unmanaged unless `project.manageConfigless` / `--configless` opts in.',
    '- **Project graph.** `dbx projects` writes `.dbx/toolchain/projects.json` (workspace dirs + dependencies), used by `sync --recursive`, the VS Code view and per-workspace changelogs.',
    '- **Vite plugin.** `dbx()` in `vite.config.*` can carry the whole toolchain config, so a Vite/Vite+ project needs no `dbx.config.*`; the CLI reads the plugin options back. dbx never manages `vite.config.*` in plugin mode, and Vite+ passthrough commands are gated on Vite+ being detected.',
    '- **MCP.** `dbx mcp:serve` exposes every public dbx API over MCP; `dbx mcp:install` writes the server + skill for Claude, Codex, VS Code, OpenCode, Pi or a custom directory.',
    '- **Sections.** `project`, `ci` (workflows + changelog), `fmt`, `lint`, `biome`, `tsconfig`, `loader`, `templates`, `vite`, `watch`, `logger`, `providers`; every workflow under `ci` is opt-in.',
    '- **Runtime.** Node ≥ 22.22.1 (or ≥ 24.11.0) and Yarn 4 (corepack); Vite+ (`vp`) resolves at the repo root.',
].join('\n');

/** The hand-picked entries kept at the top of the generated guide sidebar. */
const INTRODUCTION = {
    text: 'Introduction',
    items: [
        { text: 'Getting Started', link: '/guide/' },
        { text: 'Monorepo Guide', link: '/guide/monorepo' },
        { text: 'VS Code Extension', link: '/guide/vscode' },
        { text: 'Vite+', link: '/guide/vite' },
        {
            text: 'Config reference',
            collapsed: true,
            items: [
                { text: 'Overview', link: '/config/' },
                { text: 'CLI reference', link: '/config/cli' },
                { text: 'Environment variables', link: '/config/env' },
                { text: 'dbx.config', link: '/config/reference' },
            ],
        },
        {
            text: 'Config generator',
            collapsed: true,
            items: [
                { text: 'Overview', link: '/guide/config-generator/' },
                { text: 'Describe a scope', link: '/guide/config-generator/describe-a-scope' },
                { text: 'Create the engine', link: '/guide/config-generator/create-the-engine' },
                { text: 'Generate', link: '/guide/config-generator/generate' },
                { text: 'CLI commands', link: '/guide/config-generator/cli-commands' },
                { text: 'Load the config', link: '/guide/config-generator/load-the-config' },
                { text: 'Generated outputs', link: '/guide/config-generator/generated-outputs' },
                {
                    text: 'Client and server',
                    link: '/guide/config-generator/client-and-server',
                },
                { text: 'Real-world shape', link: '/guide/config-generator/real-world-shape' },
                { text: 'API reference', link: '/guide/config-generator/api' },
            ],
        },
        {
            text: 'Migrations',
            collapsed: true,
            items: [
                { text: 'Overview', link: '/guide/migrations/' },
                { text: 'Migrating from v1 to v2', link: '/guide/migrations/v1-v2' },
                { text: 'Migrating from v2 to v3', link: '/guide/migrations/v2-v3' },
            ],
        },
        {
            text: 'Contribute',
            collapsed: true,
            items: [
                { text: 'Overview', link: '/contribute/' },
                { text: 'Development', link: '/contribute/development' },
                { text: 'Documentation', link: '/contribute/documentation' },
            ],
        },
        { text: 'LLMs', link: '/llms' },
    ],
};

/** The first sidebar section on the config and LLMs pages. */
const HOME = {
    text: 'Home',
    items: [{ text: 'Guide', link: '/guide/' }],
};

/** Generated sidebar links that the hand-picked Introduction already covers. */
const INTRODUCTION_LINKS = new Set([
    '/guide/index.html',
    '/guide/monorepo.html',
    '/guide/vscode.html',
    '/guide/vite.html',
    '/llms',
    '/llms.html',
]);

/**
 * VitePress 1.6 deep-merges a plugin's `config` hook result into the existing
 * config. The auto-sidebar plugin mutates the config and returns the whole
 * object, which duplicates the plugin + sidebar arrays. Keep the in-place
 * mutation but return nothing so Vite does not merge the config into itself.
 */
function autoSidebar(options: Parameters<typeof AutoSidebar>[0]) {
    const plugin = AutoSidebar(options) as any;
    const configure = plugin.config;
    plugin.config = async function (config: any, env: any) {
        const handler = typeof configure === 'function' ? configure : configure?.handler;
        await handler?.call(this, config, env);
    };
    return plugin;
}

/** Icons for language labels the plugin's built-in map does not know. */
const CODE_ICONS = {
    TypeScript: 'vscode-icons:file-type-typescript',
    JSON: {
        light: 'vscode-icons:file-type-light-json',
        dark: 'vscode-icons:file-type-json',
    },
    Bash: 'logos:bash-icon',
    Shell: 'logos:bash-icon',
    Gitignore: 'vscode-icons:file-type-git',
};

export default withFolderTree(
    defineConfig({
        // Carbon's base config: appearance, scroll offsets, the SSR settings its
        // components need and a default LLM plugin. We override `vite.plugins` below
        // so the LLM plugin runs once (with our copy) rather than twice.
        ...carbonThemeBaseConfig,
        title: 'deltabox toolchain',
        description: DESCRIPTION,
        cleanUrls: true,
        // `/llms.txt` and `/llms-full.txt` are generated by the LLM plugin (not
        // VitePress pages), so the dead-link checker should ignore them.
        ignoreDeadLinks: ['/llms.txt', '/llms-full.txt'],
        head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo/logo.svg' }]],

        vite: {
            ...carbonThemeBaseConfig.vite,
            plugins: [
                // Generate the sidebar from the docs tree so nested pages (eg.
                // `/guide/config-generator/create-the-engine`) are always listed.
                // The manual sidebar must stay removed for the plugin to work.
                autoSidebar({
                    path: '.',
                    scanRootMdFiles: false,
                    ignoreList: ['node_modules', 'public'],
                    titleFromFile: true,
                    // Nested sections start collapsed; the guide itself stays open.
                    collapsed: true,
                    // Put `index.md` first so each section's overview leads its group.
                    beforeCreateSideBarItems(files) {
                        const index = files.filter(file => file.toLowerCase() === 'index.md');
                        const rest = files
                            .filter(file => file.toLowerCase() !== 'index.md')
                            .sort((a, b) => a.localeCompare(b));
                        return [...index, ...rest];
                    },
                    // Drop the entries the Introduction already covers and strip
                    // markdown backticks (eg. `defineConfig`) from generated titles.
                    sideBarItemsResolved(items) {
                        return items
                            .filter(
                                item =>
                                    !INTRODUCTION_LINKS.has(item.link ?? '') &&
                                    item.text !== 'Migrations' &&
                                    // The Config generator section is hand-picked in
                                    // the Introduction, in the overview's order.
                                    !/^config generator$/i.test(item.text ?? '')
                            )
                            .map(item => {
                                const text = item.text?.replaceAll('`', '');
                                const nextText =
                                    item.link && /(^|\/)index\.html$/.test(item.link)
                                        ? 'Overview'
                                        : text;
                                return nextText !== undefined && nextText !== item.text
                                    ? { ...item, text: nextText }
                                    : item;
                            });
                    },
                    sideBarResolved(data) {
                        const guide = Array.isArray(data['/guide/']) ? data['/guide/'] : [];
                        const guideSidebar = [INTRODUCTION, ...guide];
                        data['/guide/'] = guideSidebar;
                        // The LLMs page reuses the guide navigation as-is; the
                        // config reference adds a Home -> Guide section first.
                        data['/llms'] = guideSidebar;
                        data['/llms.html'] = guideSidebar;
                        const configItems = data['/config/'] ?? data['/config'];
                        const configSidebar = [
                            HOME,
                            ...(Array.isArray(configItems) ? configItems : []),
                        ];
                        data['/config/'] = configSidebar;
                        data['/config'] = configSidebar;
                        const contributeItems = data['/contribute/'] ?? data['/contribute'];
                        const contributeSidebar = [
                            HOME,
                            ...(Array.isArray(contributeItems) ? contributeItems : []),
                        ];
                        data['/contribute/'] = contributeSidebar;
                        data['/contribute'] = contributeSidebar;
                        return data;
                    },
                }) as any,
                // `llmstxt()` / `groupIconVitePlugin()` are typed against Vite+
                // (`@voidzero-dev/vite-plus-core`), while VitePress ships its own
                // Vite 5; the `Plugin` types don't unify, so cast to the option
                // VitePress expects.
                llmstxt({
                    domain: 'https://toolchain.deltabox.studio',
                    title: 'deltabox toolchain',
                    description: DESCRIPTION,
                    details: LLMS_DETAILS,
                    // The `/llms` page reuses the guide sidebar (the same array
                    // object as `/guide/`), so drop the aliased copies before the
                    // plugin flattens the sidebar into the llms.txt table of
                    // contents. VitePress still uses the full sidebar config.
                    sidebar: (sidebar: DefaultTheme.Sidebar | undefined) => {
                        if (!sidebar || Array.isArray(sidebar)) return sidebar;
                        const seen = new Set<unknown>();
                        const entries = Object.entries(sidebar as Record<string, unknown>).filter(
                            ([key, value]) => {
                                // The Introduction already lists every config page
                                // under its "Config reference" group.
                                if (key === '/config/' || key === '/config') return false;
                                // The Introduction already lists the contribute pages.
                                if (key === '/contribute/' || key === '/contribute') return false;
                                // The LLMs page only mirrors the guide navigation.
                                if (key === '/llms' || key === '/llms.html') return false;
                                if (seen.has(value)) return false;
                                seen.add(value);
                                return true;
                            }
                        );
                        return Object.fromEntries(entries) as DefaultTheme.Sidebar;
                    },
                }) as any,
                groupIconVitePlugin({
                    customIcon: CODE_ICONS,
                    // `defaultLabels` forces the icon CSS to be generated even when the
                    // virtual stylesheet is emitted before the pages are transformed (as
                    // in a static build), so titled/grouped blocks always get an icon.
                    defaultLabels: [
                        'npm',
                        'yarn',
                        'pnpm',
                        'bun',
                        'TypeScript',
                        'Bash',
                        'Shell',
                        'JSON',
                        'Gitignore',
                    ],
                }) as any,
            ],
        },
        markdown: {
            ...carbonThemeBaseConfig.markdown,
            config(md) {
                // Icons only on code groups (`::: code-group`) and fences with an
                // explicit `[title]`; plain language-only fences stay untouched.
                md.use(groupIconMdPlugin as any, { titleBar: { includeSnippet: true } });
            },
        },

        // Publish the generated dbx JSON schema at the site root so editors can
        // point at https://toolchain.deltabox.studio/config.schema.json.
        buildEnd(siteConfig) {
            const schema = resolve(siteConfig.root, '../../config.schema.json');
            if (existsSync(schema)) {
                copyFileSync(schema, resolve(siteConfig.outDir, 'config.schema.json'));
            }
        },
        themeConfig: {
            logo: '/logo/logo.svg',
            siteTitle: false,
            nav: [
                { text: 'Guide', link: '/guide/' },
                { text: 'Config', link: '/config/' },
                { text: 'Migrations', link: '/guide/migrations/' },
                { text: 'Contribute', link: '/contribute/' },
                {
                    text: `v${pkg.version}`,
                    items: [
                        {
                            text: 'Changelog',
                            link: 'https://github.com/deltabox-studio/toolchain/blob/main/CHANGELOG.md',
                        },
                        {
                            text: 'Releases',
                            link: 'https://github.com/deltabox-studio/toolchain/releases',
                        },
                        {
                            text: 'npm',
                            link: 'https://www.npmjs.com/package/@deltabox/toolchain',
                        },
                    ],
                },
            ],
            socialLinks: [{ icon: 'github', link: 'https://github.com/deltabox-studio/toolchain' }],
            outline: { level: [2, 3] },
            search: { provider: 'local' },
            editLink: {
                pattern: 'https://github.com/deltabox-studio/toolchain/edit/main/apps/docs/:path',
                text: 'Edit this page on GitHub',
            },
            footer: {
                message:
                    'Released under the <a href="https://github.com/deltabox-studio/toolchain/blob/main/LICENSE">MPL-2.0 License</a>.',
                copyright: `Copyright © ${CURRENT_YEAR} <a href="https://github.com/deltabox-studio">deltabox</a>`,
            },
        },
    })
);
