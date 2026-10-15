import { defineConfig } from '@deltabox/toolchain';

/**
 * The toolchain dogfoods itself. `dbx sync` manages this repo's CI/changelog
 * workflows, `commitlint.config.mjs` and the Conventional-Commits VS Code
 * settings from here.
 *
 * Changelog automation follows the `dev` -> `main` flow: pushes to `dev` generate
 * the changelog (and version bumps), and pushes to `main` open the release PR.
 */
export default defineConfig({
    toolchain: {
        project: {
            type: 'monorepo-root',
            name: 'toolchain',
            scope: '@deltabox',
            author: 'Victor Sango <victor@deltabox.studio>',
            license: 'MPL-2.0',
            homepage: 'https://toolchain.deltabox.studio',
            repo: 'https://github.com/deltabox-studio/toolchain',
            description:
                'All-in-one toolchain: scaffold projects, manage templates, configs, tsconfigs, changelogs and builds.',
            nodeVersion: '22',
            packageManager: 'yarn',
            packageManagerVersion: '4.17.1',
        },
        changelog: {
            // The workspace names double as commitlint scopes.
            scopes: [
                'shared',
                'config',
                'core',
                'project',
                'tsconfig',
                'tsdown',
                'biome',
                'vite',
                'template',
                'migrate',
                'changelog',
                'vscode',
                'cli',
                'ci',
                'release',
                'deps',
            ],
            workflows: {
                // Keep the hand-written CI checks on top of the generated
                // workflow (commitlint + `sync --check` + build come first).
                ci: {
                    pullRequestBranches: [
                        'main',
                        'dev',
                        'release/**',
                        'feat/**',
                        'feature/**',
                        'fix/**',
                        'chore/**',
                        'dependabot/**',
                    ],
                    steps: {
                        after: [
                            { name: 'Check (format + lint)', run: 'yarn check' },
                            { name: 'Test', run: 'yarn test' },
                            {
                                name: 'Generate config docs + schema',
                                run: 'yarn config:generate',
                            },
                            {
                                name: 'Verify generated config artifacts are up to date',
                                run: [
                                    'yarn format',
                                    'git diff --exit-code -- apps/docs/config/reference.md config.schema.json',
                                ].join('\n'),
                            },
                            {
                                name: 'Build docs',
                                run: 'yarn workspace @deltabox/toolchain-docs build',
                            },
                        ],
                    },
                },
            },
        },
    },
});
