import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vite-plus/test';

import { addProjectProviderRegistry } from '@deltabox/toolchain/core';
import { logger } from '@deltabox/toolchain/shared';

import { projectsCommand } from '../src/cli/commands/projects.js';
import { providerPassthroughCommands } from '../src/cli/commands/providers.js';
import { extractConfigSelection } from '../src/cli/config-selection.js';
import {
    builtinCommands,
    createCli,
    extractLogOptions,
    extractUpdateCheck,
    MACHINE_OUTPUT_COMMANDS,
    runCli,
    suppressesUpdateNotice,
    withDefaultVite,
} from '../src/cli/index.js';
import { isPassthroughCommand } from '../src/cli/register.js';
import { isNewer } from '../src/cli/update-check.js';
import {
    applyReplacementsDeep,
    camelCase,
    deepMerge,
    kebabCase,
    pascalCase,
    sort,
} from '../src/index.js';
import { defaultSyncTasks, selectSyncTasks } from '../src/sync.js';

describe('root API re-exports', () => {
    it('exposes shared helpers from the root', () => {
        expect(camelCase('foo bar')).toBe('fooBar');
        expect(kebabCase('fooBar')).toBe('foo-bar');
        expect(pascalCase('foo bar')).toBe('FooBar');
        expect(sort({ b: 1, a: 2 })).toEqual({ a: 2, b: 1 });
        expect(deepMerge({ a: { b: 1 } } as any, { a: { c: 2 } })).toEqual({ a: { b: 1, c: 2 } });
        expect(applyReplacementsDeep('{{x}}', { x: 'y' })).toBe('y');
    });
});

describe('dbx sync task selection', () => {
    it('selects tasks by name and rejects unknown ones', () => {
        const tasks = defaultSyncTasks();
        expect(selectSyncTasks(tasks, ['tsconfig']).map(task => task.name)).toEqual(['tsconfig']);
        expect(selectSyncTasks(tasks, ['tsconfig', 'vite']).map(task => task.name)).toEqual([
            'tsconfig',
            'vite',
        ]);
        expect(() => selectSyncTasks(tasks, ['nope'])).toThrow(/unknown sync task/);
    });
});

describe('dbx CLI', () => {
    it('registers the built-in commands', () => {
        const names = builtinCommands().map(c => c.name);
        expect(names).toContain('projects');
        expect(names).toContain('sync');
        expect(names).toContain('watch');
        expect(names).toContain('tsconfig');
        expect(names).toContain('cleanup');
        expect(names).toContain('cleanup:turbo');
        expect(names).toContain('changelog');
        expect(names).toContain('project:init');
        expect(names).toContain('fmt');
        expect(names).toContain('lint');
    });

    it('does not register the consumer-bound config commands', () => {
        // Deliberate: `configCommands()` needs a consumer `ConfigEngine`, so the
        // root CLI never exposes a `config:*` group. A project registers them
        // on its own program instead.
        const names = builtinCommands().map(c => c.name);
        expect(names.some(name => name.startsWith('config:'))).toBe(false);
    });

    it('builds a program with the expected subcommands', () => {
        const program = createCli();
        const registered = program.commands.map(c => c.name());
        expect(registered).toEqual(
            expect.arrayContaining([
                'projects',
                'sync',
                'watch',
                'tsconfig',
                'cleanup',
                'cleanup:turbo',
                'changelog',
            ])
        );
        expect(program.name()).toBe('dbx');
    });

    it('flags provider passthrough commands but not built-ins', () => {
        const run = (argv: string[]): void => {
            const program = createCli();
            program.exitOverride();
            // Swallow the help/error output so the test stays quiet.
            program.configureOutput({ writeOut: () => {}, writeErr: () => {} });
            expect(() => program.parse(['node', 'dbx', ...argv])).toThrow();
        };

        expect(isPassthroughCommand()).toBe(false);
        run(['vite:dev', '--help']);
        expect(isPassthroughCommand()).toBe(true);
        run(['sync', '--help']);
        expect(isPassthroughCommand()).toBe(false);
    });

    it('lets a subcommand reuse a global option name', async () => {
        const seen: unknown[] = [];
        const program = createCli([
            {
                name: 'changelog',
                description: 'fake changelog',
                options: [{ flags: '--version <semver>', description: 'Target version.' }],
                run: opts => {
                    seen.push(opts.version);
                },
            },
        ]);
        program.exitOverride();
        program.configureOutput({ writeOut: () => {}, writeErr: () => {} });
        await program.parseAsync(['node', 'dbx', 'changelog', '--version', '1.5.0']);
        expect(seen).toEqual(['1.5.0']);
    });
});

describe('config selection flags', () => {
    it('rejects --config together with --no-config before loading a config', async () => {
        const error = vi.spyOn(logger, 'error').mockImplementation(() => {});
        const previous = process.exitCode;
        try {
            await runCli(['node', 'dbx', '--config', 'dbx.custom.ts', '--no-config', 'sync']);
            expect(error).toHaveBeenCalledWith(expect.stringContaining('cannot be used together'));
            expect(process.exitCode).toBe(1);
        } finally {
            process.exitCode = previous;
            error.mockRestore();
        }
    });

    it('extracts --config / --no-config and respects `--`', () => {
        const argv = (value: string): string[] => ['node', 'dbx', ...value.split(' ')];
        expect(extractConfigSelection(argv('--config dbx.config.test.ts sync'))).toEqual({
            argv: ['node', 'dbx', 'sync'],
            selection: { config: 'dbx.config.test.ts' },
        });
        expect(extractConfigSelection(argv('sync --no-config'))).toEqual({
            argv: ['node', 'dbx', 'sync'],
            selection: { noConfig: true },
        });
        expect(extractConfigSelection(argv('--config=dbx.config.test.ts sync'))).toEqual({
            argv: ['node', 'dbx', 'sync'],
            selection: { config: 'dbx.config.test.ts' },
        });
        expect(extractConfigSelection(argv('run -- --config x --no-config'))).toEqual({
            argv: ['node', 'dbx', 'run', '--', '--config', 'x', '--no-config'],
            selection: {},
        });
    });

    it('does not consume a following flag as the config path', () => {
        const argv = (value: string): string[] => ['node', 'dbx', ...value.split(' ')];
        expect(extractConfigSelection(argv('--config --no-config sync'))).toEqual({
            argv: ['node', 'dbx', '--config', 'sync'],
            selection: { noConfig: true },
        });
        expect(extractConfigSelection(argv('--config -- sync'))).toEqual({
            argv: ['node', 'dbx', '--config', '--', 'sync'],
            selection: {},
        });
    });

    it('rejects an empty --config value', async () => {
        const error = vi.spyOn(logger, 'error').mockImplementation(() => {});
        const previous = process.exitCode;
        try {
            await runCli(['node', 'dbx', '--config=', 'sync']);
            expect(error).toHaveBeenCalledWith(expect.stringContaining('non-empty file path'));
            expect(process.exitCode).toBe(1);
        } finally {
            process.exitCode = previous;
            error.mockRestore();
        }
    });
});

describe('default Vite+ command', () => {
    const argv = (...args: string[]) => ['node', 'dbx', ...args];

    it('inserts `vite` for a bare Vite+ command', () => {
        expect(withDefaultVite(argv('dev'))).toEqual(argv('vite', 'dev'));
        expect(withDefaultVite(argv('build', '--mode', 'production'))).toEqual([
            'node',
            'dbx',
            'vite',
            'build',
            '--mode',
            'production',
        ]);
        expect(withDefaultVite(argv('run', '-r', 'build'))).toEqual(
            argv('vite', 'run', '-r', 'build')
        );
    });

    it('keeps the first-class `fmt` and `lint` commands', () => {
        expect(withDefaultVite(argv('fmt', '--check'))).toEqual(argv('fmt', '--check'));
        expect(withDefaultVite(argv('lint', '--fix'))).toEqual(argv('lint', '--fix'));
    });

    it('defaults a Vite+ alias too', () => {
        expect(withDefaultVite(argv('i'))).toEqual(argv('vite', 'i'));
    });

    it('leaves built-in commands, options and unknowns untouched', () => {
        expect(withDefaultVite(argv('sync', '--check'))).toEqual(argv('sync', '--check'));
        expect(withDefaultVite(argv('migrate', '--from', 'biome'))).toEqual(
            argv('migrate', '--from', 'biome')
        );
        expect(withDefaultVite(argv('vite', 'dev'))).toEqual(argv('vite', 'dev'));
        expect(withDefaultVite(argv('not-a-real-command'))).toEqual(argv('not-a-real-command'));
        expect(withDefaultVite(argv('--help'))).toEqual(argv('--help'));
        expect(withDefaultVite(['node', 'dbx'])).toEqual(['node', 'dbx']);
    });
});

describe('logger flag pre-scan', () => {
    const argv = (...args: string[]) => ['node', 'dbx', ...args];

    it('pulls the flags out before or after the subcommand', () => {
        expect(extractLogOptions(argv('--log-level', 'debug', 'sync'))).toEqual({
            argv: ['node', 'dbx', 'sync'],
            options: { level: 'debug' },
        });
        expect(extractLogOptions(argv('sync', '--no-color', '--log-level=warn'))).toEqual({
            argv: ['node', 'dbx', 'sync'],
            options: { level: 'warn', color: false },
        });
    });

    it('leaves everything after `--` untouched', () => {
        expect(extractLogOptions(argv('run', '--', '--color', '--log-level=debug'))).toEqual({
            argv: ['node', 'dbx', 'run', '--', '--color', '--log-level=debug'],
            options: {},
        });
    });

    it('does not consume a following flag as the log level', () => {
        expect(extractLogOptions(argv('--log-level', '--no-color'))).toEqual({
            argv: ['node', 'dbx'],
            options: { color: false },
        });
        expect(extractLogOptions(argv('--log-level', 'warn', '--no-color'))).toEqual({
            argv: ['node', 'dbx'],
            options: { level: 'warn', color: false },
        });
    });
});

describe('default sync tasks', () => {
    it('includes the Vite+ sync task', () => {
        expect(defaultSyncTasks().map(task => task.name)).toContain('vite');
    });
});

describe('dbx projects --max-depth', () => {
    function projectTree(): string {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-projects-depth-'));
        fs.writeFileSync(path.join(cwd, 'package.json'), '{"name":"root","version":"1.0.0"}');
        fs.mkdirSync(path.join(cwd, 'packages', 'app'), { recursive: true });
        fs.writeFileSync(
            path.join(cwd, 'packages', 'app', 'package.json'),
            '{"name":"app","version":"1.0.0"}'
        );
        return cwd;
    }

    it('rejects a non-numeric depth instead of disabling the limit', () => {
        const cwd = projectTree();
        try {
            expect(() =>
                projectsCommand().run?.(
                    { maxDepth: 'abcd', write: false },
                    { cwd, projectType: 'project', config: {}, tokens: {} }
                )
            ).toThrow(/invalid --max-depth/);
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });

    it('scans only the root at depth 0', () => {
        const cwd = projectTree();
        const raw = vi.spyOn(logger, 'raw').mockImplementation(() => {});
        try {
            projectsCommand().run?.(
                { maxDepth: '0', write: false, json: true },
                { cwd, projectType: 'project', config: {}, tokens: {} }
            );
            const graph = JSON.parse(raw.mock.calls[0]![0] as string) as {
                projects: { dir: string }[];
            };
            expect(graph.projects.map(project => project.dir)).toEqual(['.']);
        } finally {
            raw.mockRestore();
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });
});

describe('update check', () => {
    const argv = (...args: string[]) => ['node', 'dbx', ...args];

    it('compares versions', () => {
        expect(isNewer('1.2.9', '1.2.8')).toBe(true);
        expect(isNewer('1.3.0', '1.2.9')).toBe(true);
        expect(isNewer('1.2.8', '1.2.8')).toBe(false);
        expect(isNewer('1.2.0', '1.3.0')).toBe(false);
    });

    it('strips the update-check flags and respects `--`', () => {
        expect(extractUpdateCheck(argv('--no-update-check', 'sync'))).toEqual({
            argv: ['node', 'dbx', 'sync'],
            updateCheck: false,
        });
        expect(extractUpdateCheck(argv('run', '--', '--no-update-check'))).toEqual({
            argv: ['node', 'dbx', 'run', '--', '--no-update-check'],
            updateCheck: true,
        });
    });

    it('never prints the notice for commands that own stdout', () => {
        // The notice would corrupt the JSON-RPC stream (`mcp:serve`) or the
        // default-JSON output (`template:info`).
        expect(MACHINE_OUTPUT_COMMANDS.has('mcp:serve')).toBe(true);
        expect(MACHINE_OUTPUT_COMMANDS.has('template:info')).toBe(true);
    });

    it('suppresses the notice for -V, --version and machine flags', () => {
        expect(suppressesUpdateNotice(argv('-V'))).toBe(true);
        expect(suppressesUpdateNotice(argv('--version'))).toBe(true);
        expect(suppressesUpdateNotice(argv('--help'))).toBe(true);
        expect(suppressesUpdateNotice(argv('changelog', '--release-body', '1.0.0'))).toBe(true);
        expect(suppressesUpdateNotice(argv('mcp:serve'))).toBe(true);
        expect(suppressesUpdateNotice(argv('sync'))).toBe(false);
    });
});

describe('provider registration policy', () => {
    it('does not register commands from a denied provider', () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-provider-policy-'));
        try {
            const registry = path.join(cwd, 'providers');
            fs.mkdirSync(registry, { recursive: true });
            fs.writeFileSync(
                path.join(registry, 'providers.json'),
                JSON.stringify([
                    {
                        id: 'acme',
                        name: 'Acme',
                        binary: 'echo',
                        commands: [{ name: 'acme:run', subcommand: 'run', description: 'Run it' }],
                    },
                ])
            );
            addProjectProviderRegistry(cwd, './providers');

            const passthroughs = providerPassthroughCommands(cwd);
            expect(passthroughs.map(command => command.name)).toContain('acme:run');
            // Provider passthroughs are registry-dependent, so the generated CLI
            // reference omits them.
            expect(passthroughs.every(command => command.hidden)).toBe(true);
            expect(
                providerPassthroughCommands(cwd, {
                    registry: { providers: { deny: [registry] } },
                }).map(command => command.name)
            ).not.toContain('acme:run');
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });
});

describe('passthrough pre-scan', () => {
    const argv = (...args: string[]) => ['node', 'dbx', ...args];
    const passthrough = (name: string) => name === 'vite';

    it('leaves logger flags after a passthrough command untouched', () => {
        expect(
            extractLogOptions(argv('vite', 'run', 'build', '--log-level', 'debug'), passthrough)
        ).toEqual({
            argv: ['node', 'dbx', 'vite', 'run', 'build', '--log-level', 'debug'],
            options: {},
        });
    });

    it('leaves update-check flags after a passthrough command untouched', () => {
        expect(extractUpdateCheck(argv('vite', '--no-update-check'), passthrough)).toEqual({
            argv: ['node', 'dbx', 'vite', '--no-update-check'],
            updateCheck: true,
        });
    });
});
