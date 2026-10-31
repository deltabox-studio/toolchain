import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { addProjectProviderRegistry } from '@deltabox/toolchain-core';

import { providerPassthroughCommands } from '../src/cli/commands/providers.js';
import { extractConfigSelection } from '../src/cli/config-selection.js';
import {
    builtinCommands,
    createCli,
    extractLogOptions,
    extractUpdateCheck,
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
import { defaultSyncTasks } from '../src/sync.js';

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
});

describe('config selection flags', () => {
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
});

describe('default Vite+ command', () => {
    const argv = (...args: string[]) => ['node', 'dbx', ...args];

    it('inserts `vite` for a bare Vite+ command', () => {
        expect(withDefaultVite(argv('fmt', '--check'))).toEqual(argv('vite', 'fmt', '--check'));
        expect(withDefaultVite(argv('lint', '--fix'))).toEqual(argv('vite', 'lint', '--fix'));
        expect(withDefaultVite(argv('run', '-r', 'build'))).toEqual(
            argv('vite', 'run', '-r', 'build')
        );
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
});

describe('default sync tasks', () => {
    it('includes the Vite+ sync task', () => {
        expect(defaultSyncTasks().map(task => task.name)).toContain('vite');
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

            expect(providerPassthroughCommands(cwd).map(command => command.name)).toContain(
                'acme:run'
            );
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
