import { defineConfig } from '@deltabox/toolchain';

/**
 * The toolchain dogfoods itself. `dbx sync` manages this repo's CI/changelog
 * workflows, `commitlint.config.mjs` and the Conventional-Commits VS Code
 * settings from here.
 *
 * Every workspace also has its own `dbx.config.ts` (holding its Vite Task
 * definitions), so `dbx sync --recursive` writes each workspace's
 * `vite.config.ts` shim. That shim imports `@deltabox/toolchain/vite`, which a
 * workspace cannot resolve on its own here because the root package *is*
 * `@deltabox/toolchain`; the root `devDependencies` self-link
 * (`"@deltabox/toolchain": "portal:."`) provides it.
 *
 * Changelog automation follows the `dev` -> `main` flow: pushes to `dev` generate
 * the changelog (and version bumps), and pushes to `main` run the hand-written
 * `release.yml` (tag + GitHub Release with the VSIX, npm publish, Marketplace).
 * The generated `release` workflow is disabled in favour of that custom one.
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
        // Generate each workspace `tsconfig.json` from its `tsconfig.default.json`,
        // wiring the shared `paths` from `tsconfig.workspaces.json`. The template
        // fixtures under `packages/tsconfig/src/templates` are excluded.
        tsconfig: {
            exclude: ['**/src/templates/**'],
        },
        changelog: {
            vscode: true,
            // `dev` has no default: preset it to keep the `dev` -> `main` flow
            // (pushes to `dev` generate the changelog; `main` releases).
            branches: { dev: 'dev' },
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
                // Release on every push to `main`: tag + GitHub Release (notes
                // from CHANGELOG.md + the packaged VS Code extension), publish to
                // npm and publish the extension to the VS Code Marketplace. The
                // whole flow is managed here — no hand-written workflow file.
                release: {
                    extra: {
                        permissions: { contents: 'write', 'id-token': 'write' },
                        concurrency: { group: 'release', 'cancel-in-progress': false },
                    },
                    jobs: {
                        'create-release-pr': {
                            name: 'release',
                            'runs-on': 'ubuntu-latest',
                            // The npm OIDC trusted publisher is bound to this GitHub
                            // environment, so the job must declare it for the OIDC
                            // `environment` claim to match. It is also what exposes
                            // the environment's `NPM_TOKEN` secret to the job.
                            environment: 'toolchain / release',
                            steps: [
                                {
                                    name: 'Checkout',
                                    uses: 'actions/checkout@v4',
                                    with: {
                                        'fetch-depth': 0,
                                        token: '${{ secrets.GITHUB_TOKEN }}',
                                    },
                                },
                                {
                                    name: 'Setup Node',
                                    uses: 'actions/setup-node@v4',
                                    with: {
                                        'node-version': '{{nodeVersion}}',
                                        'registry-url': 'https://registry.npmjs.org',
                                    },
                                },
                                {
                                    name: 'Enable Corepack',
                                    run: 'corepack enable\ncorepack prepare {{packageManager}}@{{yarnVersion}} --activate',
                                },
                                {
                                    name: 'Install dependencies',
                                    run: '{{packageManager}} install --immutable',
                                },
                                { name: 'Build', run: '{{packageManager}} build' },
                                {
                                    name: 'Resolve version + release state',
                                    id: 'release',
                                    run: [
                                        'version="$(node -p "require(\'./package.json\').version")"',
                                        'echo "version=$version" >> "$GITHUB_OUTPUT"',
                                        'if git ls-remote --exit-code --tags origin "v$version" >/dev/null 2>&1; then',
                                        '  echo "Release v$version already exists; skipping."',
                                        '  echo "skip=true" >> "$GITHUB_OUTPUT"',
                                        'else',
                                        '  echo "skip=false" >> "$GITHUB_OUTPUT"',
                                        'fi',
                                    ].join('\n'),
                                },
                                {
                                    name: 'Package the VS Code extension',
                                    if: "steps.release.outputs.skip == 'false'",
                                    run: '{{packageManager}} workspace toolchain-vscode package:vsix',
                                },
                                {
                                    name: 'Extract release notes',
                                    if: "steps.release.outputs.skip == 'false'",
                                    run: [
                                        // Aggregate every changelog entry from the last
                                        // tag up to the latest, so a release that skips
                                        // versions includes them all.
                                        'last_tag="$(git describe --tags --abbrev=0 2>/dev/null || true)"',
                                        'if [ -n "$last_tag" ]; then',
                                        '  last_version="${last_tag#v}"',
                                        '  notes="$(awk -v v="$last_version" \'/^## / { if ($2 == v) exit; started = 1 } started { print }\' CHANGELOG.md 2>/dev/null || true)"',
                                        'else',
                                        '  notes="$(cat CHANGELOG.md 2>/dev/null || true)"',
                                        'fi',
                                        '[ -n "$notes" ] || notes="Release v${{ steps.release.outputs.version }}"',
                                        'printf \'%s\\n\' "$notes" > RELEASE_NOTES.md',
                                    ].join('\n'),
                                },
                                {
                                    name: 'Create the GitHub Release',
                                    if: "steps.release.outputs.skip == 'false'",
                                    env: { GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
                                    run: [
                                        'gh release create "v${{ steps.release.outputs.version }}" \\',
                                        '  --title "v${{ steps.release.outputs.version }}" \\',
                                        '  --notes-file RELEASE_NOTES.md \\',
                                        '  "packages/vscode/deltabox-toolchain.vsix"',
                                    ].join('\n'),
                                },
                                {
                                    // Trusted publishing (OIDC) needs npm >= 11.5.1
                                    // (and >= 11.15.0 for `npm stage`), but Node 22
                                    // bundles npm 10 — without the upgrade the publish
                                    // silently falls back to token auth and fails.
                                    name: 'Upgrade npm for trusted publishing',
                                    if: "steps.release.outputs.skip == 'false'",
                                    run: 'npm install -g npm@^11.15.1',
                                },
                                {
                                    // Try a direct publish first; if the trusted
                                    // publisher isn't allowed to `npm publish`, fall
                                    // back to a **staged** publish (which is always
                                    // permitted for a trusted publisher and defers
                                    // the maintainer's 2FA approval). npm exchanges
                                    // the GitHub OIDC token for a short-lived registry
                                    // token and adds provenance automatically. `yarn
                                    // pack` resolves `catalog:`/`workspace:` first.
                                    name: 'Publish to npm (fallback: staged)',
                                    if: "steps.release.outputs.skip == 'false'",
                                    run: [
                                        '{{packageManager}} pack --out toolchain.tgz',
                                        'if npm publish toolchain.tgz --access public; then',
                                        '  echo "Published to npm."',
                                        'else',
                                        '  echo "::warning::Direct publish failed; falling back to a staged publish."',
                                        '  npm stage publish toolchain.tgz --access public',
                                        'fi',
                                    ].join('\n'),
                                },
                            ],
                        },
                    },
                },
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
                            // Auto-fix formatting + lint instead of failing the
                            // build on drift.
                            { name: 'Format + lint (auto-fix)', run: 'yarn check --fix' },
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
        vite: {
            // Vitest: every package's tests + the root CLI tests.
            test: {
                include: ['packages/**/tests/**/*.test.ts', 'tests/**/*.test.ts'],
                environment: 'node',
                exclude: ['**/node_modules/**', '**/dist/**'],
            },

            // Oxfmt (from `biome.json` formatter + javascript.formatter).
            fmt: {
                useTabs: false,
                tabWidth: 4,
                printWidth: 100,
                endOfLine: 'lf',
                singleQuote: true,
                jsxSingleQuote: false,
                quoteProps: 'as-needed',
                trailingComma: 'es5',
                semi: true,
                arrowParens: 'avoid',
                bracketSpacing: true,
                bracketSameLine: false,
                ignorePatterns: [
                    '**/node_modules/**',
                    '**/dist/**',
                    '**/.turbo/**',
                    '**/.generated/**',
                    '*.json',
                    'packages/*/*.json',
                    '**/tsconfig*.json',
                    'biome.json',
                    '**/*.yml',
                    '**/*.yaml',
                    // The changelog pipeline owns its own markdown format.
                    '**/CHANGELOG.md',
                    'CHANGELOG.proposed.md',
                    // Generated by `dbx sync` (root + each workspace); keep them
                    // byte-stable for `sync --check`.
                    '**/vite.config.ts',
                ],
                // Biome `assist.actions.source.organizeImports.groups`.
                sortImports: {
                    groups: [
                        'builtin',
                        'external',
                        ['custom0', 'internal'],
                        ['custom1', 'custom2'],
                        ['parent', 'sibling', 'index'],
                    ],
                    internalPattern: ['~/', '@/'],
                    newlinesBetween: true,
                    sortPackageJson: false,
                    customGroups: [
                        { groupName: 'custom0', elementNamePattern: ['deltabox', '@deltabox/**'] },
                        { groupName: 'custom1', elementNamePattern: ['lucide*'] },
                        { groupName: 'custom2', elementNamePattern: ['iconify*'] },
                    ],
                },
            },

            // Oxlint (from `biome.json` linter.rules; `info` -> `off`, no Oxlint level).
            lint: {
                ignorePatterns: [
                    '**/node_modules/**',
                    '**/dist/**',
                    '**/.turbo/**',
                    '**/.generated/**',
                ],
                rules: {
                    'jsx-a11y/alt-text': 'off',
                    'react/button-has-type': 'off',
                    'jsx-a11y/click-events-have-key-events': 'off',
                    'typescript/no-empty-object-type': 'off',
                    'no-useless-escape': 'off',
                    'typescript/no-useless-empty-export': 'off',
                    'no-constant-condition': 'off',
                    'no-inner-declarations': 'off',
                    'no-unused-vars': 'warn',
                    'no-case-declarations': 'off',
                    'react-hooks/exhaustive-deps': 'off',
                    'prefer-exponentiation-operator': 'off',
                    'typescript/no-non-null-assertion': 'off',
                    'prefer-template': 'off',
                    'no-return-assign': 'off',
                    eqeqeq: 'warn',
                    'typescript/no-explicit-any': 'off',
                    // The markdown sanitizers intentionally match control chars.
                    'no-control-regex': 'off',
                },
            },

            // Vite Task (`vp run`) replaces turbo. Each package declares its own
            // build/typecheck/test tasks (with cache input/output) in its vite.config.ts;
            // here we define the workspace-root umbrella tasks.
            run: {
                tasks: {
                    'build:root': {
                        command: 'tsdown --config-loader unrun',
                        cache: {
                            input: [{ auto: true }, '!dist/**', '!**/*.tsbuildinfo'],
                            output: ['dist/**'],
                        },
                    },
                    'typecheck:root': {
                        command: 'tsc -p tsconfig.build.json --noEmit',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },
                    'test:root': {
                        command: 'vitest run',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },
                },
            },
        },
    },
});
