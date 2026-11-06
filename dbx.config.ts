import { defineConfig } from '@deltabox/toolchain';

/**
 * The toolchain dogfoods itself. `dbx sync` manages this repo's CI/changelog
 * workflows, `commitlint.config.mjs` and the Conventional-Commits VS Code
 * settings from here.
 *
 * Every workspace also has its own `dbx.config.ts` (holding its Vite Task
 * definitions), so `dbx sync --recursive` writes each workspace's
 * `vite.config.ts`. The dogfooded shims are static (`vite.shim: 'static'`), so
 * Vite+ can load them without a built `@deltabox/toolchain` `dist`; the root
 * `devDependencies` self-link (`"@deltabox/toolchain": "portal:."`) still
 * provides the package to TypeScript/tests.
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
                "All-in-one development toolchain that let's you scaffold projects, generate and manage configs, tsconfigs, custom templates, syncing, changelogs, CI, Vite+, migrations, and more.",
            nodeVersion: '22',
            packageManager: 'yarn',
            packageManagerVersion: '4.17.1',
        },
        // Generate each workspace `tsconfig.json` from its `tsconfig.default.json`,
        // wiring the shared `paths` from `tsconfig.workspaces.json`. The template
        // fixtures under `packages/tsconfig/src/templates` are excluded.
        tsconfig: {
            exclude: ['**/src/templates/**'],
            // Auto-wire the aliases and rewrite the private workspaces onto the
            // published `@deltabox/toolchain/<name>` subpaths (eg.
            // `@deltabox/toolchain-shared` -> `@deltabox/toolchain/shared`).
            auto: {
                rewriteAlias: {
                    '^@deltabox/toolchain-(.+)$': '@deltabox/toolchain/$1',
                },
            },
            // Keep the hand-written references: the typecheck task uses
            // `tsc -p --noEmit` (not `tsc -b`), and `tsc -p` does not follow
            // project references. Keep them in sync manually when exports change.
            refsAuto: false,
        },
        ci: {
            changelog: {
                vscode: true,
                // `dev` has no default: preset it to keep the `dev` -> `main` flow
                // (pushes to `dev` generate the changelog; `main` releases).
                branches: { dev: 'dev' },
                // The workspace names double as commitlint scopes.
                commitlint: {
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
                },
            },
            // Release on every push to `main`: tag + GitHub Release (notes
            // from CHANGELOG.md + the packaged VS Code extension), publish to
            // npm and publish the extension to the VS Code Marketplace. The
            // whole flow is managed here - no hand-written workflow file.
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
                                uses: 'actions/checkout@v5',
                                with: {
                                    'fetch-depth': 0,
                                    token: '${{ secrets.GITHUB_TOKEN }}',
                                },
                            },
                            {
                                name: 'Setup Node',
                                uses: 'actions/setup-node@v5',
                                with: {
                                    'node-version': '{{nodeVersion}}',
                                    'registry-url': 'https://registry.npmjs.org',
                                    // v5 auto-caches before Corepack is enabled.
                                    'package-manager-cache': false,
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
                                    // Aggregate every changelog entry since the last
                                    // released version. The CLI helper only considers
                                    // tags whose versions exist in CHANGELOG.md, so
                                    // calendar/CI tags cannot leak the whole file.
                                    'notes="$({{packageManager}} dbx changelog --release-notes "${{ steps.release.outputs.version }}")"',
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
            // workflow (commitlint + `sync --check --recursive` + build come first).
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
                        { name: 'Format + lint (auto-fix)', run: 'yarn check:fix' },
                        { name: 'Test', run: 'yarn test' },
                        { name: 'Typecheck', run: 'yarn typecheck' },
                        {
                            name: 'Generate config docs + schema',
                            run: 'yarn config:generate',
                        },
                        {
                            name: 'Verify generated config artifacts are up to date',
                            run: [
                                'yarn format',
                                'git diff --exit-code -- apps/docs/config/reference.md apps/docs/config/index.md apps/docs/config/cli.md apps/docs/config/env.md config.schema.json packages/shared/src/config-types.ts packages/shared/src/config-schema/generated/biome-config.ts',
                            ].join('\n'),
                        },
                        {
                            name: 'Build docs',
                            run: 'yarn docs build',
                        },
                    ],
                },
                // The extension host tests need a display on Linux, so they run
                // in their own job under Xvfb after the regular checks pass.
                jobs: {
                    'vscode-integration': {
                        name: 'VS Code integration',
                        'runs-on': 'ubuntu-latest',
                        needs: 'ci',
                        steps: [
                            {
                                name: 'Checkout',
                                uses: 'actions/checkout@v5',
                                with: {
                                    'fetch-depth': 0,
                                    token: '${{ secrets.GITHUB_TOKEN }}',
                                },
                            },
                            {
                                name: 'Setup Node',
                                uses: 'actions/setup-node@v5',
                                with: {
                                    'node-version': '{{nodeVersion}}',
                                    // v5 auto-caches before Corepack is enabled.
                                    'package-manager-cache': false,
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
                            {
                                // Cache the VS Code download by the exact stable
                                // version, so a new release is fetched and saved
                                // under a fresh key instead of reused.
                                name: 'Resolve VS Code version',
                                id: 'vscode',
                                run: 'version="$(curl -fsSL "https://update.code.visualstudio.com/api/releases/stable?released=true" | jq -r \'.[0]\' || true)"\necho "version=${version:-unknown}" >> "$GITHUB_OUTPUT"',
                            },
                            {
                                name: 'Cache VS Code',
                                uses: 'actions/cache@v6',
                                with: {
                                    path: 'packages/vscode/.vscode-test/vscode-linux-x64-${{ steps.vscode.outputs.version }}',
                                    key: '${{ runner.os }}-vscode-${{ steps.vscode.outputs.version }}',
                                },
                            },
                            {
                                name: 'Run VS Code extension integration tests',
                                run: 'xvfb-run -a {{packageManager}} workspace toolchain-vscode test:integration',
                            },
                        ],
                    },
                },
            },
            issues: true,
            sync: true,
        },
        vite: {
            // Dogfood a static shim so Vite+ can load it without a built dist.
            shim: 'static',
            // Resolve workspace imports through the tsconfig `paths` in Vite.
            resolve: {
                tsconfigPaths: true,
            },

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
                    // Generated at a wider width from a vendor schema; formatting
                    // them at 100 columns would more than double their size. Use
                    // `**/` so the patterns also match from each workspace root.
                    '**/config-schema/generated/biome-config.ts',
                    '**/config-schema/generated/azure-pipelines.ts',
                    '**/config-schema/generated/oxlint-config.ts',
                ],
                // Import sorting comes from the toolchain defaults; the
                // `workspace` group is resolved from the project graph.
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
                    'react/exhaustive-deps': 'off',
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
                        command: 'tsc -p tsconfig.json --noEmit',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },
                    'test:root': {
                        command: 'vitest run',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },
                    'format:root': {
                        command: 'vp fmt',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    'format:check:root': {
                        command: 'vp fmt --check',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    'lint:root': {
                        command: 'vp lint --fix',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    'lint:check:root': {
                        command: 'vp lint',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    'check:root': {
                        command: 'vp check',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    'check:fix:root': {
                        command: 'vp check --fix',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                },
            },
        },
    },
});
