import { describe, expect, it } from 'vitest';

import {
    applyOverrides,
    changelogBreakingCallbackSchema,
    type DbxConfig,
    dbxConfigSchema,
    defineConfig,
    resolveChangelogConfig,
    resolveFmtTool,
    resolveFmtTools,
    resolveLintTool,
    resolveLintTools,
    resolveOxcFmtConfig,
    resolveOxcLintConfig,
    sectionConfig,
    sectionEnabled,
} from '../src/index.js';

describe('dbx.config model', () => {
    it('defineConfig is the identity', () => {
        const config: DbxConfig = {
            toolchain: { project: { name: 'acme' }, ci: true, vite: true },
        };
        expect(defineConfig(config)).toBe(config);
    });

    it('sections are opt-in by presence', () => {
        expect(sectionEnabled(undefined)).toBe(false);
        expect(sectionEnabled(true)).toBe(true);
        expect(sectionEnabled(false)).toBe(false);
        expect(sectionEnabled({ enabled: false })).toBe(false);
        expect(sectionEnabled({})).toBe(true);
        expect(sectionConfig<{ enabled?: boolean; refs: boolean }>({ refs: true })).toEqual({
            refs: true,
        });
        expect(sectionConfig(true)).toBeUndefined();
    });

    it('every configurable area is expressible', () => {
        const config = defineConfig({
            toolchain: {
                project: {
                    type: 'monorepo-root',
                    name: 'acme',
                    scope: '@acme',
                    author: 'Acme',
                    license: 'MIT',
                    homepage: 'https://acme.dev',
                    repo: 'https://github.com/acme/app',
                    nodeVersion: '22',
                    packageManager: 'yarn',
                    packageManagerVersion: '4.17.1',
                    description: 'Acme app',
                },
                // CI workflows + the changelog pipeline live in the `ci` section.
                ci: {
                    ci: true,
                    changelog: {
                        pushBranches: ['main'],
                        branches: { main: 'main', dev: 'dev' },
                        commitlint: { types: ['feat', 'fix'], scopes: ['core'] },
                        versioning: { target: 'individual' },
                        vscode: true,
                        groups: context => [
                            {
                                type: 'feat',
                                title: group => `New Features (${group.groupItems.length})`,
                                order: 0,
                            },
                            { type: 'fix', hidden: group => group.groupItems.length === 0 },
                            ...context.types.filter(type => !['feat', 'fix'].includes(type)),
                        ],
                    },
                    release: false,
                    issues: true,
                    sync: true,
                    custom: {
                        deploy: {
                            triggers: { workflow_dispatch: {} },
                            filename: 'deploy.yml',
                            dir: '.github/workflows',
                        },
                    },
                },
                biome: { vscode: true, overrides: { formatter: {} } },
                tsconfig: {
                    refs: true,
                    aliases: true,
                    indent: 2,
                    glob: ['**/tsconfig.default.json', '**/tsconfig.custom.json'],
                    rootFile: 'tsconfig.workspaces.json',
                    defaultFile: 'tsconfig.default.json',
                    buildFile: 'tsconfig.build.json',
                },
                templates: { sources: [{ type: 'local', locate: './templates' }] },
                vite: { fmt: { semi: true }, test: { include: ['src/**/*.test.ts'] } },
                watch: { debounce: 100 },
                hooks: { afterSync: () => undefined },
            },
        });

        const toolchain = config.toolchain!;
        expect(sectionEnabled(toolchain.ci)).toBe(true);
        expect(sectionConfig(toolchain.ci)?.changelog).toBeDefined();
        expect(sectionConfig(toolchain.ci)?.custom?.deploy).toBeDefined();
        expect(sectionEnabled(toolchain.tsconfig)).toBe(true);
        expect(sectionConfig(toolchain.vite)?.fmt).toEqual({ semi: true });
        expect(sectionConfig(toolchain.watch)?.debounce).toBe(100);
    });

    it('accepts external formatter/linter options without their packages installed', () => {
        const config: DbxConfig = {
            toolchain: {
                fmt: {
                    prettier: {
                        semi: false,
                        singleQuote: true,
                        plugins: ['prettier-plugin-tailwindcss'],
                    },
                    dprint: { lineWidth: 100, typescript: { semiColons: 'always' } },
                },
                lint: {
                    eslint: {
                        files: ['src/**/*.ts', ['*.test.ts']],
                        languageOptions: { ecmaVersion: 2022, globals: { window: 'readonly' } },
                        rules: { eqeqeq: 'error' },
                    },
                },
            },
        };
        expect(config.toolchain?.fmt).toBeDefined();
        expect(config.toolchain?.lint).toBeDefined();
    });

    it('accepts custom workflows but not a boolean value', () => {
        const custom = {
            toolchain: {
                ci: {
                    custom: {
                        deploy: {
                            jobs: {
                                deploy: { 'runs-on': 'ubuntu-latest', steps: [] },
                            },
                        },
                    },
                },
            },
        };
        expect(dbxConfigSchema.safeParse(custom).success).toBe(true);
        expect(
            dbxConfigSchema.safeParse({ toolchain: { ci: { custom: { deploy: true } } } }).success
        ).toBe(false);
    });

    it('accepts changelog groups in both the manual and ci sections', () => {
        const groups = [
            { type: 'feat', title: 'New Features' },
            { type: 'fix', title: 'Bug Fixes' },
        ];
        expect(
            dbxConfigSchema.safeParse({
                toolchain: {
                    changelog: { groups },
                    ci: {
                        changelog: {
                            groups: (context: { types: string[] }) =>
                                context.types.map((type: string) => type),
                        },
                    },
                },
            }).success
        ).toBe(true);
    });

    it('accepts changelog versioning callbacks and serializable forms', () => {
        const config = defineConfig({
            toolchain: {
                ci: {
                    changelog: {
                        versioning: {
                            bump: {
                                major: context => context.commit.subject.includes('!'),
                                minor: 'feat',
                                patch: '/^fix/',
                            },
                            commit: {
                                author: false,
                                format: context => `- ${context.commit.subject}`,
                            },
                            provider: 'changesets',
                        },
                    },
                },
            },
        });
        expect(dbxConfigSchema.safeParse(config).success).toBe(true);

        const callbackProvider = defineConfig({
            toolchain: {
                ci: {
                    changelog: {
                        versioning: {
                            provider: context =>
                                context.records.map(record => record.subject).join('\n'),
                        },
                    },
                },
            },
        });
        expect(dbxConfigSchema.safeParse(callbackProvider).success).toBe(true);
    });

    it('accepts complete GitHub/GitLab/Azure workflow settings', () => {
        const config = {
            toolchain: {
                ci: {
                    ci: {
                        provider: 'gitlab',
                        workflow: {
                            stages: ['test'],
                            test: { stage: 'test', script: ['yarn test'] },
                        },
                    },
                    release: {
                        provider: 'azure',
                        workflow: { steps: [{ script: 'yarn build' }] },
                    },
                    custom: {
                        deploy: {
                            provider: 'github',
                            workflow: { name: 'Deploy', on: ['push'], jobs: {} },
                        },
                    },
                },
            },
        };
        expect(dbxConfigSchema.safeParse(config).success).toBe(true);
    });

    it('implements function schemas with .implement()/.implementAsync()', async () => {
        const sync = changelogBreakingCallbackSchema.implement(commit =>
            commit.subject.includes('!')
        );
        expect(sync({ subject: 'feat!: change', body: '' })).toBe(true);

        const asyncImpl = changelogBreakingCallbackSchema.implementAsync(async commit =>
            commit.subject.includes('!')
        );
        await expect(asyncImpl({ subject: 'fix: change', body: '' })).resolves.toBe(false);
    });
});

describe('resolveChangelogConfig', () => {
    const legacy = {
        commitlint: { types: ['feat'], scopes: ['api'] },
        versioning: { target: 'individual' as const },
        vscode: true,
    };

    it('uses the manual `toolchain.changelog` options without CI', () => {
        expect(resolveChangelogConfig({ changelog: legacy })).toEqual(legacy);
    });

    it('inherits the manual options when `ci.changelog` is merely enabled', () => {
        expect(resolveChangelogConfig({ changelog: legacy, ci: { changelog: true } })).toEqual(
            legacy
        );
    });

    it('inherits the manual options under CI workflow-only overrides', () => {
        const resolved = resolveChangelogConfig({
            changelog: legacy,
            ci: { changelog: { pushBranches: ['dev'] } },
        });
        expect(resolved).toMatchObject({ ...legacy, pushBranches: ['dev'] });
    });

    it('lets explicit `ci.changelog` pipeline options win', () => {
        const resolved = resolveChangelogConfig({
            changelog: legacy,
            ci: {
                changelog: {
                    branches: { main: 'main' },
                    commitlint: { scopes: ['web'] },
                },
            },
        });
        expect(resolved?.commitlint).toEqual({ types: ['feat'], scopes: ['web'] });
        expect(resolved?.versioning).toEqual({ target: 'individual' });
        expect(resolved?.branches).toEqual({ main: 'main' });
    });

    it('disables the pipeline when `ci.changelog` is false', () => {
        expect(resolveChangelogConfig({ changelog: legacy, ci: { changelog: false } })).toBe(
            undefined
        );
        expect(
            resolveChangelogConfig({
                changelog: legacy,
                ci: { changelog: { enabled: false } },
            })
        ).toBe(undefined);
    });
});

describe('formatter/linter precedence', () => {
    const config = {
        fmt: {
            oxc: { semi: false, singleQuote: true },
            biome: {},
            prettier: {},
            dprint: true,
        },
        lint: {
            oxc: { rules: {} },
            biome: {},
            eslint: {},
        },
        vite: {
            fmt: { singleQuote: false },
            lint: { rules: { eqeqeq: 'error' as const } },
        },
    };

    it('orders tools by precedence and picks the winner', () => {
        expect(resolveFmtTools(config)).toEqual(['oxc', 'biome', 'prettier', 'dprint']);
        expect(resolveLintTools(config)).toEqual(['oxc', 'biome', 'eslint']);
        expect(resolveFmtTool(config)).toBe('oxc');
        expect(resolveLintTool(config)).toBe('oxc');
    });

    it('lets vite.fmt/lint override fmt/lint.oxc (deep merge)', () => {
        expect(resolveOxcFmtConfig(config)).toEqual({ semi: false, singleQuote: false });
        expect(resolveOxcLintConfig(config)).toEqual({ rules: { eqeqeq: 'error' } });
    });

    it('uses oxc when only vite.fmt/lint is set', () => {
        expect(resolveFmtTools({ vite: { fmt: true } })).toEqual(['oxc']);
        expect(resolveLintTools({ vite: { lint: true } })).toEqual(['oxc']);
    });

    it('treats an explicit false tool as disabled', () => {
        expect(resolveFmtTools({ fmt: { biome: false } } as never)).toEqual([]);
        expect(resolveLintTools({ lint: { eslint: false } } as never)).toEqual([]);
        expect(resolveFmtTools({ fmt: { oxc: false, biome: false } } as never)).toEqual([]);
    });
});

describe('applyOverrides', () => {
    it('layers multiple overrides and merges nested objects', () => {
        const base = { host: '0.0.0.0', auth: { password: '', ttl: 3600 } };
        const file = { host: 'localhost', auth: { password: 'file' } } as Partial<typeof base>;
        const cli = { auth: { ttl: 60 } } as Partial<typeof base>;
        expect(applyOverrides(base, file, cli)).toEqual({
            host: 'localhost',
            auth: { password: 'file', ttl: 60 },
        });
    });
});
