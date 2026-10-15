import { defineConfig } from 'vitepress';

/**
 * VitePress config for the `@deltabox/toolchain` docs. Structured like the
 * Vite+ docs: an Introduction + Guide, then a Config reference per area.
 */
export default defineConfig({
    title: 'deltabox toolchain',
    description:
        'All-in-one toolchain: scaffold projects, manage configs, tsconfigs, changelogs and builds.',
    cleanUrls: true,
    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Config', link: '/config/reference' },
            { text: 'Providers', link: '/guide/providers' },
            { text: 'Migrations', link: '/guide/migrations' },
        ],
        sidebar: {
            '/guide/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'Getting Started', link: '/guide/' },
                        { text: 'Monorepo Guide', link: '/guide/monorepo' },
                        { text: 'VS Code Extension', link: '/guide/vscode' },
                    ],
                },
                {
                    text: 'Project Toolchain',
                    items: [
                        { text: 'CLI', link: '/guide/cli' },
                        { text: 'Configuration', link: '/guide/config' },
                        { text: 'Config Generator', link: '/guide/config-generator' },
                        { text: 'Providers (Vite+)', link: '/guide/providers' },
                        { text: 'Templates', link: '/guide/templates' },
                        { text: 'Migrations', link: '/guide/migrations' },
                        { text: 'Programmatic API', link: '/guide/api' },
                    ],
                },
            ],
            '/config/': [
                {
                    text: 'Reference',
                    items: [{ text: 'dbx.config', link: '/config/reference' }],
                },
            ],
        },
        outline: { level: [2, 3] },
        search: { provider: 'local' },
        editLink: {
            pattern: 'https://github.com/deltabox-studio/toolchain/edit/main/apps/docs/:path',
            text: 'Edit this page on GitHub',
        },
    },
});
