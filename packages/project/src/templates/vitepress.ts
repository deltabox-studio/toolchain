import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../types/index.js';
import { renderGitignore } from '../typescript.js';
import { file, readme, recipe, VERSIONS } from './shared.js';

export function vitePress(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        devDependencies: { vitepress: VERSIONS.vitepress },
        scripts: {
            dev: 'vitepress dev docs',
            build: 'vitepress build docs',
            preview: 'vitepress preview docs',
            test: 'vp test',
        },
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(
                    ctx.name,
                    'A VitePress documentation site. Edit `docs/` and the sidebar in `docs/.vitepress/config.ts`.',
                    ['`yarn build` writes the static site to `docs/.vitepress/dist`.']
                )
            ),
            file(
                '.gitignore',
                `${renderGitignore()}docs/.vitepress/cache/\ndocs/.vitepress/dist/\n`
            ),
            file(
                'docs/index.md',
                [
                    '---',
                    'layout: home',
                    '',
                    'hero:',
                    `    name: ${ctx.name}`,
                    '    text: Documentation',
                    '    tagline: Everything you need to get started.',
                    '    actions:',
                    '        - theme: brand',
                    '          text: Get started',
                    '          link: /guide/getting-started',
                    '',
                    'features:',
                    '    - title: Fast',
                    '      details: Built on Vite and Vue.',
                    '    - title: Simple',
                    '      details: Write Markdown, get a static site.',
                    '---',
                    '',
                ].join('\n')
            ),
            file(
                'docs/guide/getting-started.md',
                [
                    '# Getting started',
                    '',
                    `Welcome to **${ctx.name}**.`,
                    '',
                    '1. Run `yarn dev` and open the printed URL.',
                    '2. Edit `docs/index.md` and `docs/guide/getting-started.md`.',
                    '3. Run `yarn build` to generate the static site.',
                    '',
                    '## Configuration',
                    '',
                    'The site title, description, navigation and sidebar live in',
                    '`docs/.vitepress/config.ts`.',
                    '',
                ].join('\n')
            ),
            file(
                'docs/.vitepress/config.ts',
                [
                    "import { defineConfig } from 'vitepress';",
                    '',
                    'export default defineConfig({',
                    `    title: '${ctx.name}',`,
                    `    description: 'Documentation for ${ctx.name}.',`,
                    '    cleanUrls: true,',
                    '    themeConfig: {',
                    '        nav: [{ text: "Guide", link: "/guide/getting-started" }],',
                    '        sidebar: [',
                    '            {',
                    '                text: "Guide",',
                    '                items: [',
                    '                    { text: "Getting started", link: "/guide/getting-started" },',
                    '                ],',
                    '            },',
                    '        ],',
                    '    },',
                    '});',
                    '',
                ].join('\n')
            ),
            file(
                'tests/config.test.ts',
                [
                    "import { describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import config from '../docs/.vitepress/config.js';",
                    '',
                    "describe('docs config', () => {",
                    "    it('names the site', () => {",
                    `        expect(config.title).toBe('${ctx.name}');`,
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}
