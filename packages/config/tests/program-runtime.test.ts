import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { z } from 'zod';

import type { CliCommand, CliCommandContext } from '@deltabox/toolchain/shared';

import {
    ConfigProgramError,
    createConfigEngine,
    createConfigProgram,
    renderBox,
    type ResolveConfigProgramCommands,
} from '../src/index.js';

const schema = {
    serve: z.object({ port: z.number().default(3000) }),
    build: z.object({ out: z.string().default('dist') }),
};

function engine() {
    return createConfigEngine({ schema, envPrefix: 'DBX_' });
}

describe('program create', () => {
    it('renames create/createCommand and preserves a single command', async () => {
        const seen: unknown[] = [];
        const program = engine().cli.program.create(cmd =>
            cmd('serve', {
                name: 'serve',
                description: 'Serve.',
                run: ({ values }) => void seen.push(values),
            })
        );
        expect(program.commands).toMatchObject({ name: 'serve', scope: 'serve' });
        await program.invokeAsync(['--port', '4000']);
        expect(seen[0]).toMatchObject({ port: 4000 });

        const command = engine().cli.program.createCommand('serve', {
            name: 'serve',
            run: () => {},
        });
        expect(command.scope).toBe('serve');
        expect(command.name).toBe('serve');
        expectTypeOf(command.name).toEqualTypeOf<'serve'>();
    });

    it('infers the command name from the scope', () => {
        const program = engine().cli.program.create(cmd => [cmd('serve').run(() => {})]);
        expect(program.commands[0].name).toBe('serve');
        expectTypeOf(program.commands[0].name).toEqualTypeOf<'serve'>();
    });

    it('awaits an async builder', async () => {
        const seen: unknown[] = [];
        const program = await engine().cli.program.create(async cmd => [
            cmd('serve', {
                name: 'serve',
                run: ({ values }) => void seen.push(values),
            }),
        ]);
        expect(program.commands).toHaveLength(1);
        await program.invokeAsync(['serve']);
        expect(seen).toHaveLength(1);
    });

    it('infers tuple entries and the empty fallback', () => {
        const program = engine().cli.program.create(cmd => [
            cmd('serve', { name: 'serve', run: () => {} }),
            cmd('build', { name: 'build', run: () => {} }),
        ]);
        expect(program.commands).toHaveLength(2);
        expectTypeOf(program.commands[0].scope).toEqualTypeOf<'serve' | undefined>();
        expectTypeOf(program.commands[1].scope).toEqualTypeOf<'build' | undefined>();

        const empty = engine().cli.program.create(() => []);
        expectTypeOf(empty.commands).toEqualTypeOf<CliCommand<[], CliCommandContext>[]>();
        expect(empty.commands.length).toBeGreaterThan(0);

        type Resolved = ResolveConfigProgramCommands<[], CliCommandContext>;
        expectTypeOf<Resolved>().toEqualTypeOf<CliCommand<[], CliCommandContext>[]>();
    });

    it('rejects unfinished command chains with a clear error', () => {
        expect(() => engine().cli.program.create(cmd => [cmd('serve')] as never)).toThrow(
            /finish every command with `\.run\(\)`/
        );
    });

    it('exposes program name, description, version and output routing', async () => {
        const out: string[] = [];
        const seen: string[] = [];
        const program = engine()
            .cli.program.create(cmd => [
                cmd('serve')
                    .version('2.3.4')
                    .run(() => {
                        seen.push('run');
                    }),
            ])
            .name('dbx')
            .description('Toolchain runtime.')
            .version('1.2.3')
            .output(text => out.push(text));
        const help = program.formatHelp();
        expect(help).toContain('Usage: dbx');
        expect(help).toContain('Toolchain runtime.');
        await program.invokeAsync(['--version']);
        expect(out.at(-1)).toBe('1.2.3\n');
        await program.invokeAsync(['serve', '--version']);
        expect(out.at(-1)).toBe('2.3.4\n');
        expect(seen).toEqual([]);
        await program.invokeAsync(['serve']);
        expect(seen).toEqual(['run']);
    });

    it('supports a program root command with no subcommands', async () => {
        const seen: unknown[] = [];
        const program = engine().cli.program.create(cmd =>
            cmd('serve', {
                name: 'serve',
                run: ({ values }) => void seen.push(values),
            })
        );
        await program.invokeAsync(['--port', '1234']);
        expect(seen[0]).toMatchObject({ port: 1234 });
    });

    it('defaults argv from the command/process and accepts .argv()', async () => {
        const seen: string[] = [];
        const program = engine().cli.program.create(cmd =>
            cmd('serve')
                .argv(['serve', '--port', '4321'])
                .run(({ values }) => {
                    seen.push(String(values.port));
                })
        );
        await program.invokeAsync();
        expect(seen).toEqual(['4321']);

        const explicit: string[] = [];
        const program2 = engine().cli.program.create(cmd =>
            cmd('serve').run(({ values }) => {
                explicit.push(String(values.port));
            })
        );
        program2.argv(['serve', '--port', '99']);
        await program2.invokeAsync();
        expect(explicit).toEqual(['99']);
    });
});

describe('chain shorthands', () => {
    it('accepts commander-style options, arrays and variadic lists', async () => {
        const seen: Record<string, unknown>[] = [];
        const extra = [
            { flags: '--verbose', description: 'Verbose.' },
            ['--no-color', 'Disable colour.'],
        ] as const;
        const program = engine().cli.program.create(cmd =>
            cmd('serve')
                .option('--json', 'JSON output.')
                .options([
                    ['--out <dir>', 'Output directory.', 'dist'],
                    '--check',
                    { flags: '--tag <value...>', description: 'Tags.' },
                ])
                .options(...extra)
                .run(({ values }) => {
                    expectTypeOf(values.json).toEqualTypeOf<boolean | undefined>();
                    expectTypeOf(values.out).toEqualTypeOf<string | undefined>();
                    expectTypeOf(values.check).toEqualTypeOf<boolean | undefined>();
                    expectTypeOf(values.tag).toEqualTypeOf<string[] | undefined>();
                    expectTypeOf(values.verbose).toEqualTypeOf<boolean | undefined>();
                    expectTypeOf(values.color).toEqualTypeOf<boolean | undefined>();
                    seen.push(values);
                })
        );
        await program.invokeAsync([
            'serve',
            '--json',
            '--out',
            'lib',
            '--check',
            '--tag',
            'a',
            '--verbose',
        ]);
        expect(seen[0]).toMatchObject({
            json: true,
            out: 'lib',
            check: true,
            tag: ['a'],
            verbose: true,
        });
        await program.invokeAsync(['serve', '--no-color']);
        expect(seen[1]).toMatchObject({ color: false });
    });

    it('accepts description-first and array subcommands', async () => {
        const events: string[] = [];
        const program = engine().cli.program.create(cmd => [
            cmd('serve')
                .command('build', 'Build.', sub =>
                    sub.run(() => {
                        events.push('build');
                    })
                )
                .commands([
                    [
                        'serve',
                        'Status.',
                        sub =>
                            sub.name('status').run(() => {
                                events.push('status');
                            }),
                    ],
                    ['build'],
                ])
                .subcommands([
                    [
                        'serve',
                        sub =>
                            sub.name('info').run(() => {
                                events.push('info');
                            }),
                    ],
                ])
                .run(() => {
                    events.push('serve');
                }),
        ]);
        expect(program.commands[0].commands?.map(command => command.name)).toEqual([
            'build',
            'status',
            'build',
            'info',
        ]);
        program.hook('before', 'status', payload => {
            expectTypeOf(payload.name).toEqualTypeOf<'status'>();
        });
        await program.invokeAsync(['serve', 'status']);
        await program.invokeAsync(['serve', 'info']);
        expect(events).toEqual(['status', 'info']);
    });

    it('accepts already-built commands in .commands()', async () => {
        const events: string[] = [];
        const built = engine().cli.program.createCommand('build', {
            name: 'build',
            run: () => {
                events.push('built');
            },
        });
        const program = engine().cli.program.create(cmd => [
            cmd('serve')
                .commands([built])
                .run(() => {
                    events.push('serve');
                }),
        ]);
        expect(program.commands[0].commands?.[0]).toBe(built);
        await program.invokeAsync(['serve', 'build']);
        expect(events).toEqual(['built']);
    });
});

describe('global options', () => {
    it('parses program globals for every command and hook', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(
            cmd => [
                cmd('serve')
                    .command('serve', sub =>
                        sub.name('status').run(({ values }) => {
                            seen.push(values);
                        })
                    )
                    .run(({ values }) => {
                        seen.push(values);
                    }),
            ],
            { globalOptions: [{ flags: '--json', description: 'JSON output.' }] }
        );
        expectTypeOf(program.globals[0].flags).toEqualTypeOf<'--json'>();
        program.hook('before', 'serve', payload => {
            expectTypeOf(payload.values.json).toEqualTypeOf<boolean | undefined>();
        });
        await program.invokeAsync(['serve', 'status', '--json']);
        await program.invokeAsync(['serve', '--json']);
        expect(seen[0]).toMatchObject({ json: true });
        expect(seen[1]).toMatchObject({ json: true });
    });

    it('keeps command globals local unless a child opts into inherit', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(cmd => [
            cmd('serve')
                .globalOptions([['--root <dir>', 'Root.'], '--verbose'])
                .command('serve', sub =>
                    sub
                        .name('status')
                        .inherit()
                        .run(({ values }) => {
                            expectTypeOf(values.root).toEqualTypeOf<string | undefined>();
                            expectTypeOf(values.verbose).toEqualTypeOf<boolean | undefined>();
                            seen.push(values);
                        })
                )
                .command('serve', sub =>
                    sub.name('other').run(({ values }) => {
                        seen.push(values);
                    })
                )
                .commands([
                    {
                        scope: 'serve',
                        inherit: true,
                        setup: sub =>
                            sub.name('object').run(({ values }) => {
                                seen.push(values);
                            }),
                    },
                ])
                .run(({ values }) => {
                    expectTypeOf(values.root).toEqualTypeOf<string | undefined>();
                    seen.push(values);
                }),
        ]);
        await program.invokeAsync(['serve', 'status', '--root', 'lib', '--verbose']);
        await program.invokeAsync(['serve', '--root', 'app']);
        await program.invokeAsync(['serve', 'object', '--root', 'obj']);
        expect(seen[0]).toMatchObject({ root: 'lib', verbose: true });
        expect(seen[1]).toMatchObject({ root: 'app' });
        expect(seen[2]).toMatchObject({ root: 'obj' });
        await expect(program.invokeAsync(['serve', 'other', '--root', 'x'])).rejects.toThrow(
            /unknown option "--root"/
        );
    });

    it('supports runtime-only commands without a config scope', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(cmd => [
            cmd('plain')
                .description('A runtime-only command.')
                .option('--flag', 'Flag.')
                .run(({ values, context }) => {
                    expectTypeOf(values.flag).toEqualTypeOf<boolean | undefined>();
                    expectTypeOf(context).toEqualTypeOf<CliCommandContext>();
                    seen.push(values);
                }),
        ]);
        await program.invokeAsync(['plain', '--flag']);
        expect(seen[0]).toMatchObject({ flag: true });

        const command = engine().cli.program.createCommand('plain2', {
            name: 'plain2',
            description: 'Another runtime-only command.',
            options: [{ flags: '--name <value>', description: 'Name.' }],
            run: () => {},
        });
        expect(command.name).toBe('plain2');
        expect(command.scope).toBe('plain2');
    });

    it('honours explicit inherit(false) and child global options', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(cmd => [
            cmd('serve')
                .globalOption('--root <dir>', 'Root.')
                .commands([
                    {
                        scope: 'serve' as const,
                        inherit: false,
                        setup: sub =>
                            sub.name('child').run(({ values }) => {
                                seen.push(values);
                            }),
                    },
                    {
                        scope: 'serve' as const,
                        globalOptions: [['--child <value>', 'Child.']],
                        setup: sub =>
                            sub.name('child-own').run(({ values }) => {
                                seen.push(values);
                            }),
                    },
                ])
                .run(() => {}),
        ]);
        await program.invokeAsync(['serve', 'child-own', '--child', 'x']);
        expect(seen[0]).toMatchObject({ child: 'x' });
        await expect(program.invokeAsync(['serve', 'child', '--root', 'x'])).rejects.toThrow(
            /unknown option "--root"/
        );
    });

    it('lets command options override duplicate global flags', async () => {
        const program = engine().cli.program.create(
            cmd => [
                cmd('serve')
                    .option({
                        flags: '--mode <value>',
                        description: 'Local mode.',
                        type: 'number',
                    })
                    .run(({ values }) => {
                        expectTypeOf(values.mode).toEqualTypeOf<number | undefined>();
                    }),
            ],
            {
                globalOptions: [{ flags: '--mode <value>', description: 'Global mode.' }],
            }
        );
        await program.invokeAsync(['serve', '--mode', '42']);
    });

    it('shows program and command globals in help', () => {
        const program = engine().cli.program.create(
            cmd => [
                cmd('serve')
                    .globalOption('--root <dir>', 'Command root.')
                    .run(() => {}),
            ],
            { globalOptions: [{ flags: '--json', description: 'JSON output.' }] }
        );
        expect(program.formatHelp()).toContain('--json');
        expect(program.formatHelp('serve')).toContain('--json');
        expect(program.formatHelp('serve')).toContain('--root');
    });

    it('accepts program globals before the command', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(
            cmd => [
                cmd('serve', {
                    name: 'serve',
                    run: ({ values }) => void seen.push(values),
                }),
            ],
            { globalOptions: [{ flags: '--json', description: 'JSON output.' }] }
        );
        await program.invokeAsync(['--json', 'serve']);
        expect(seen[0]).toMatchObject({ json: true });

        const listProgram = engine().cli.program.create(
            cmd => [
                cmd('serve', {
                    name: 'serve',
                    run: ({ values }) => void seen.push(values),
                }),
            ],
            {
                globalOptions: [{ flags: '--tag <value...>', description: 'Tags.' }],
            }
        );
        await listProgram.invokeAsync(['--tag', 'a', 'b', 'serve']);
        expect(seen[1]).toMatchObject({ tag: ['a', 'b'] });
    });

    it('accepts a parent global before a subcommand', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(cmd => [
            cmd('serve')
                .globalOption('--root <dir>', 'Root.')
                .command('serve', child =>
                    child
                        .name('status')
                        .inherit()
                        .run(({ values }) => void seen.push(values))
                )
                .run(() => {}),
        ]);
        await program.invokeAsync(['serve', '--root', 'x', 'status']);
        expect(seen[0]).toMatchObject({ root: 'x' });
    });
});

describe('program invocation', () => {
    it('scopes options per command and never leaks parent/sibling options', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(cmd => [
            cmd('serve')
                .option({ flags: '--root <dir>', description: 'Root.' })
                .command('serve', child =>
                    child
                        .name('status')
                        .option({ flags: '--json', description: 'JSON.' })
                        .run(({ values }) => void seen.push(values))
                )
                .run(({ values }) => void seen.push(values)),
            cmd('build')
                .name('build')
                .option({ flags: '--out <dir>', description: 'Out.' })
                .run(({ values }) => void seen.push(values)),
        ]);
        await program.invokeAsync(['serve', 'status', '--json']);
        await program.invokeAsync(['build', '--out', 'lib']);
        expect(seen[0]).toEqual({ json: true });
        expect(seen[1]).toEqual({ out: 'lib' });
    });

    it('coerces numbers, arrays, booleans and negated flags', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(cmd =>
            cmd('serve', {
                name: 'serve',
                options: [
                    { flags: '--tag <value...>', description: 'Tags.' },
                    { flags: '--tags <value...>', description: 'Array tags.', type: 'array' },
                    { flags: '--no-color', description: 'No colour.' },
                ],
                run: ({ values }) => void seen.push(values),
            })
        );
        await program.invokeAsync([
            'serve',
            '--port',
            '8080',
            '--tag',
            'a',
            '--tag',
            'b',
            '--tags',
            'x,y',
            'z',
        ]);
        expect(seen[0]).toMatchObject({
            port: 8080,
            tag: ['a', 'b'],
            tags: ['x', 'y', 'z'],
        });
        await program.invokeAsync(['serve', '--no-color']);
        expect(seen[1]).toMatchObject({ color: false });
    });

    it('parses hyphenated long options into camel-cased values', async () => {
        // Regression: `parseArgs` options were keyed by the camel-cased name
        // (`dryRun`), so `--dry-run` / `--release-body` were rejected as
        // unknown options by the selected command.
        const seen: Record<string, unknown>[] = [];
        const program = createConfigProgram([
            {
                name: 'changelog',
                description: 'Changelog.',
                options: [
                    { flags: '--dry-run', description: 'Dry run.' },
                    { flags: '--release-body <semver>', description: 'Release body.' },
                    {
                        flags: '--release-include-prereleases',
                        description: 'Include prereleases.',
                    },
                    { flags: '--no-release-group', description: 'No release group.' },
                    { flags: '--intro-file <file>', description: 'Intro file.' },
                    { flags: '--tag <value...>', description: 'Tags.' },
                ],
                run: (values: Record<string, unknown>) => void seen.push(values),
            },
        ]);
        await program.invokeAsync([
            'changelog',
            '--dry-run',
            '--release-body',
            '3.0.0-beta.18',
            '--release-include-prereleases',
            '--intro-file',
            'intro.md',
            '--tag',
            'a',
            'b',
        ]);
        expect(seen[0]).toEqual({
            dryRun: true,
            releaseBody: '3.0.0-beta.18',
            releaseIncludePrereleases: true,
            introFile: 'intro.md',
            tag: ['a', 'b'],
        });
        await program.invokeAsync(['changelog', '--no-release-group']);
        expect(seen[1]).toMatchObject({ releaseGroup: false });
    });

    it('rejects invalid number/boolean option values', () => {
        const program = createConfigProgram([
            {
                name: 'serve',
                description: 'Serve.',
                options: [
                    { flags: '--port <value>', description: 'Port.', type: 'number' },
                    { flags: '--enabled <value>', description: 'Enabled.', type: 'boolean' },
                ],
                run: () => {},
            },
        ]);
        expect(() => program.invoke(['serve', '--port', 'nope'])).toThrow(ConfigProgramError);
        expect(() => program.invoke(['serve', '--enabled', 'maybe'])).toThrow(ConfigProgramError);
    });

    it('lets a positive flag override a preceding negative form', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = createConfigProgram([
            {
                name: 'serve',
                description: 'Serve.',
                options: [
                    { flags: '--auto', description: 'Auto.' },
                    { flags: '--no-auto', description: 'No auto.' },
                ],
                run: (values: Record<string, unknown>) => void seen.push(values),
            },
        ]);
        await program.invokeAsync(['serve', '--no-auto', '--auto']);
        await program.invokeAsync(['serve', '--auto', '--no-auto']);
        expect(seen[0]).toMatchObject({ auto: true });
        expect(seen[1]).toMatchObject({ auto: false });
    });

    it('supports optional values, variadic values and -- operands', async () => {
        const seen: Record<string, unknown>[] = [];
        const program = engine().cli.program.create(cmd =>
            cmd('serve', {
                name: 'serve',
                args: [{ name: 'file', description: 'File.', required: false }],
                options: [
                    { flags: '--restore [kind]', description: 'Restore.' },
                    { flags: '--tag <value...>', description: 'Tags.' },
                ],
                run: ({ values }) => void seen.push(values),
            })
        );
        await program.invokeAsync(['serve', '--restore']);
        await program.invokeAsync(['serve', '--restore', 'base']);
        await program.invokeAsync(['serve', '--tag', 'a', 'b', 'c']);
        await program.invokeAsync(['serve', '--', '--help']);
        expect(seen[0]).toMatchObject({ restore: true });
        expect(seen[1]).toMatchObject({ restore: 'base' });
        expect(seen[2]).toMatchObject({ tag: ['a', 'b', 'c'] });
        expect(seen[3]).toMatchObject({ file: '--help' });
    });

    it('runs sync handlers and rejects async handlers in invoke()', async () => {
        const program = engine().cli.program.create(cmd =>
            cmd('serve', {
                name: 'serve',
                run: () => {},
            })
        );
        expect(() => program.invoke(['serve'])).not.toThrow();

        const asyncProgram = engine().cli.program.create(cmd =>
            cmd('serve', {
                name: 'serve',
                async run() {
                    await Promise.resolve();
                },
            })
        );
        expect(() => asyncProgram.invoke(['serve'])).toThrow(/invokeAsync/);
        await asyncProgram.invokeAsync(['serve']);
    });

    it('throws generic errors with suggestions', () => {
        const program = engine().cli.program.create(cmd => [
            cmd('serve').run(() => {}),
            cmd('build')
                .name('build')
                .run(() => {}),
        ]);
        expect(() => program.invoke(['serv'])).toThrow(ConfigProgramError);
        expect(() => program.invoke(['serv'])).toThrow(/did you mean "serve"/);
        expect(() => program.invoke(['serve', '--prot'])).toThrow(/did you mean "--port"/);
        expect(() => program.invoke([])).toThrow(/missing command/);

        const choices = engine().cli.program.create(cmd =>
            cmd('serve', {
                name: 'serve',
                options: [
                    {
                        flags: '--mode <value>',
                        description: 'Mode.',
                        choices: ['dev', 'prod'],
                    },
                ],
                run: () => {},
            })
        );
        expect(() => choices.invoke(['serve', '--mode', 'de'])).toThrow(/did you mean "dev"/);
    });

    it('lets consumers override invalid-argv messages', () => {
        const program = engine().cli.program.create(cmd => [cmd('serve').run(() => {})]);
        program.configure({ error: { messages: { unknownCommand: 'nope: {input}' } } });
        expect(() => program.invoke(['serv'])).toThrow(/nope: serv/);
    });
});

describe('program help and errors', () => {
    it('accepts program options through engine.cli.program.create', async () => {
        const output: string[] = [];
        const program = engine().cli.program.create(
            cmd => [cmd('serve', { name: 'serve', description: 'Serve.', run: () => {} })],
            {
                name: 'myapp',
                disableColors: true,
                writeOut: text => output.push(text),
                format: { colors: { command: text => `[${text}]` } },
            }
        );
        await program.invokeAsync(['--help']);
        const help = output.join('');
        expect(help).toContain('Usage: myapp');
        expect(help).not.toContain('[myapp]');
    });

    it('renders colourless boxed help and plain/custom variants', () => {
        const program = engine().cli.program.create(cmd => [
            cmd('serve', {
                name: 'serve',
                description: 'Serve the app.',
                options: [{ flags: '--port <value>', description: 'Port.' }],
                run: () => {},
            }),
        ]);
        program.configure({ help: { template: 'box' } });
        const boxed = program.formatHelp('serve');
        expect(boxed).toContain('Usage: serve [options]');
        expect(boxed).toContain('--port <value>');
        expect(boxed).not.toContain('\u001b[');
        expect(boxed).toContain('╭');

        program.configure({ help: { template: 'plain' } });
        expect(program.formatHelp('serve')).not.toContain('╭');

        program.configure({ help: { template: () => 'CUSTOM HELP' } });
        expect(program.formatHelp('serve')).toBe('CUSTOM HELP');
    });

    it('supports recursive and per-item colours', () => {
        const program = engine().cli.program.create(cmd => [
            cmd('serve', {
                name: 'serve',
                description: 'Serve.',
                run: () => {},
            }),
        ]);
        program.configure({
            colors: {
                command: text => `[${text}]`,
                option: text => `<${text}>`,
            },
            options: { '--port': text => `(${text})` },
        });
        const help = program.formatHelp('serve');
        expect(help).toContain('[serve]');
        expect(help).toContain('(--port');

        program.configure({
            commands: { serve: { colors: { command: text => `{${text}}` } } },
        });
        expect(program.formatHelp('serve')).toContain('{serve}');
    });

    it('disables configured colours on demand', async () => {
        const output: string[] = [];
        const program = createConfigProgram(
            [
                {
                    name: 'serve',
                    description: 'Serve.',
                    options: [{ flags: '--port <value>', description: 'Port.' }],
                    run: () => {},
                },
            ],
            {
                globalOptions: [{ flags: '--no-color', description: 'No colour.' }] as const,
                disableColors: args => {
                    expectTypeOf(args.color).toEqualTypeOf<boolean | undefined>();
                    return args.color === false;
                },
                writeOut: text => output.push(text),
            }
        );
        program.configure({
            colors: { command: text => `[${text}]`, option: text => `<${text}>` },
            error: { template: 'message', messageColor: text => `[${text}]` },
        });

        // A function resolver applies once it has seen an invocation.
        expect(program.formatHelp('serve')).toContain('[serve]');

        await program.invokeAsync(['serve', '--help', '--no-color']);
        const help = output.join('');
        expect(help).not.toContain('[serve]');
        expect(help).not.toContain('<--port');
        expect(help).toContain('--port <value>');
        expect(program.formatHelp('serve')).not.toContain('[serve]');
        expect(program.formatError(new Error('boom'))).toBe('boom');
    });

    it('supports a static disableColors value and async resolvers', async () => {
        const staticProgram = createConfigProgram(
            [{ name: 'serve', description: 'Serve.', run: () => {} }],
            { disableColors: true }
        );
        staticProgram.configure({
            colors: { command: text => `[${text}]` },
            error: { template: 'message', messageColor: text => `[${text}]` },
        });
        expect(staticProgram.formatHelp('serve')).not.toContain('[serve]');
        expect(staticProgram.formatError(new Error('boom'))).toBe('boom');

        const output: string[] = [];
        const asyncProgram = createConfigProgram(
            [{ name: 'serve', description: 'Serve.', run: () => {} }],
            {
                globalOptions: [{ flags: '--no-color', description: 'No colour.' }] as const,
                disableColors: async args => args.color === false,
                writeOut: text => output.push(text),
            }
        );
        asyncProgram.configure({ colors: { command: text => `[${text}]` } });
        await asyncProgram.invokeAsync(['serve', '--help', '--no-color']);
        expect(output.join('')).not.toContain('[serve]');
        expect(() => asyncProgram.invoke(['serve', '--help', '--no-color'])).toThrow(/invokeAsync/);
    });

    it('passes parsed globals and the context to disableColors', async () => {
        const seen: { args: unknown; context: unknown }[] = [];
        const program = createConfigProgram(
            [{ name: 'serve', description: 'Serve.', run: () => {} }],
            {
                globalOptions: [{ flags: '--no-color', description: 'No colour.' }] as const,
                disableColors: (args, context) => {
                    seen.push({ args, context });
                    return false;
                },
            }
        );
        const context = { cwd: '/work' };
        await program.invokeAsync(['serve', '--no-color'], context);
        expect(seen).toEqual([{ args: { color: false }, context }]);
    });

    it('renders boxed errors with stack, and supports variants', () => {
        const program = engine().cli.program.create(cmd => [
            cmd('serve', { name: 'serve', run: () => {} }),
        ]);
        program.configure({ error: { template: 'box' } });
        const error = new Error('boom');
        const boxed = program.formatError(error);
        expect(boxed).toContain('boom');
        expect(boxed).toContain('╭');
        expect(boxed).toContain('at ');

        program.configure({ error: { messageOnly: true } });
        expect(program.formatError(error)).toBe('boom');

        program.configure({ error: { messageOnly: false, showStack: false } });
        const noStack = program.formatError(error);
        expect(noStack).toContain('boom');
        expect(noStack).not.toContain('at ');

        program.configure({ error: { template: () => 'CUSTOM ERROR' } });
        expect(program.formatError(error)).toBe('CUSTOM ERROR');
    });

    it('renders customisable boxes', () => {
        expect(
            renderBox('hi', {
                padding: 0,
                corners: {
                    topLeft: '+',
                    topRight: '+',
                    bottomLeft: '+',
                    bottomRight: '+',
                },
                horizontal: '-',
                vertical: '|',
            })
        ).toBe(['+--+', '|hi|', '+--+'].join('\n'));
    });
});

describe('program hooks', () => {
    it('runs before/after hooks for all or one command with inferred values', async () => {
        const events: string[] = [];
        const seen: unknown[] = [];
        const program = engine().cli.program.create(cmd => [
            cmd('serve', {
                name: 'serve',
                options: [{ flags: '--limit <count>', description: 'Limit.', type: 'number' }],
                run: ({ values }) => void seen.push(values),
            }),
            cmd('build', { name: 'build', run: () => {} }),
        ]);
        program.hook('before', 'all', payload => {
            events.push(`before:all:${payload.name}`);
            expectTypeOf(payload.context).toEqualTypeOf<CliCommandContext>();
        });
        program.hook('after', 'serve', payload => {
            events.push(`after:serve:${payload.name}`);
            expectTypeOf(payload.values.limit).toEqualTypeOf<number | undefined>();
            expectTypeOf(payload.scope).toEqualTypeOf<'serve'>();
            expectTypeOf(payload.name).toEqualTypeOf<'serve'>();
        });
        program.hooks({
            phase: 'before',
            target: 'build',
            handler: payload => {
                events.push(`before:build:${payload.name}`);
            },
        });

        await program.invokeAsync(['serve', '--port', '1', '--limit', '2']);
        await program.invokeAsync(['build']);
        expect(events).toEqual([
            'before:all:serve',
            'after:serve:serve',
            'before:all:build',
            'before:build:build',
        ]);
        expect(seen).toEqual([{ port: 1, limit: 2 }]);
    });

    it('infers an overridden command name as a hook target', () => {
        const program = engine().cli.program.create(cmd => [
            cmd('serve')
                .name('status')
                .run(() => {}),
        ]);
        program.hook('before', 'status', payload => {
            expectTypeOf(payload.name).toEqualTypeOf<'status'>();
            expectTypeOf(payload.scope).toEqualTypeOf<'serve'>();
        });
    });

    it('awaits async hooks in invokeAsync', async () => {
        const events: string[] = [];
        const program = engine().cli.program.create(cmd => [
            cmd('serve', { name: 'serve', run: () => {} }),
        ]);
        program.hook('before', 'serve', async () => {
            await Promise.resolve();
            events.push('before');
        });
        program.hook('after', 'serve', async () => {
            await Promise.resolve();
            events.push('after');
        });
        await program.invokeAsync(['serve']);
        expect(events).toEqual(['before', 'after']);
    });
});

describe('program binary execution', () => {
    it('executes a referenced binary instead of the handler', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-program-bin-'));
        const script = path.join(dir, 'bin.mjs');
        fs.writeFileSync(
            script,
            "import fs from 'node:fs'; fs.writeFileSync(process.argv[2], process.argv.slice(3).join(','));",
            'utf-8'
        );
        const program = engine().cli.program.create(cmd =>
            cmd('serve', {
                name: 'run',
                bin: script,
                run: () => {
                    throw new Error('handler must not run');
                },
            })
        );
        await program.invokeAsync(['run', 'out.txt', 'a', 'b'], { cwd: dir });
        expect(fs.readFileSync(path.join(dir, 'out.txt'), 'utf-8')).toBe('a,b');
        fs.rmSync(dir, { recursive: true, force: true });
    });
});
