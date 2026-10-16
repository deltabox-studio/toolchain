import { defineConfig } from '@deltabox/toolchain';

/**
 * The toolchain dogfoods itself. `dbx sync` manages this repo's CI/changelog
 * workflows, `commitlint.config.mjs` and the Conventional-Commits VS Code
 * settings from here.
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
                                        'notes="$(awk \'/<!-- release:start -->/{f=1;next} /<!-- release:end -->/{exit} f{print}\' CHANGELOG.md 2>/dev/null || true)"',
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
                                    // Trusted publishing (OIDC) needs npm >= 11.5.1,
                                    // but Node 22 bundles npm 10 — without the
                                    // upgrade `npm publish` silently falls back to
                                    // token auth and fails with a misleading 404.
                                    name: 'Upgrade npm for trusted publishing',
                                    if: "steps.release.outputs.skip == 'false'",
                                    run: 'npm install -g npm@^11.5.1',
                                },
                                {
                                    // Trusted publishing (OIDC) is the primary path:
                                    // npm exchanges the GitHub OIDC token for a
                                    // short-lived registry token and adds provenance
                                    // automatically. `NODE_AUTH_TOKEN` (the
                                    // environment's `NPM_TOKEN`) is only a fallback
                                    // used when the OIDC exchange fails — it is
                                    // optional and may be absent, so never rely on
                                    // it. `yarn pack` resolves `catalog:`/`workspace:`
                                    // before `npm publish`.
                                    name: 'Publish to npm',
                                    if: "steps.release.outputs.skip == 'false'",
                                    env: { NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}' },
                                    run: [
                                        '{{packageManager}} pack --out toolchain.tgz',
                                        'npm publish toolchain.tgz --access public',
                                    ].join('\n'),
                                },
                                {
                                    name: 'Publish to the VS Code Marketplace',
                                    if: "steps.release.outputs.skip == 'false'",
                                    env: { VSCE_PAT: '${{ secrets.VSCE_PAT }}' },
                                    run: 'npx --yes @vscode/vsce publish --packagePath packages/vscode/deltabox-toolchain.vsix',
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
    },
});
