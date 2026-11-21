import { afterEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { z } from 'zod';

import type { CliCommandContext } from '@deltabox/toolchain/shared';

import { createConfigEngine, configCliCommand, generateConfigCliOptions, generateConfigProgram } from '../src/index.js';

const nativeEnv = { ...process.env };

afterEach(() => {
    for (const key of Object.keys(process.env)) {
        if (!(key in nativeEnv)) delete process.env[key];
    }
    for (const [key, value] of Object.entries(nativeEnv)) process.env[key] = value;
});

describe('recursive CLI option resolution', () => {
    it('expands object union branches into dotted paths', () => {
        const schema = z.object({
            format: z.union([
                z.boolean(),
                z.object({
                    fix: z.boolean().describe('Rewrite files'),
                    command: z.string().describe('Formatter command'),
                }),
            ]),
        });
        const defs = generateConfigCliOptions(schema).options;
        expect(defs.map(def => def.path)).toEqual(['format.fix', 'format.command']);
        expect(defs.map(def => def.flag)).toEqual(['--format-fix', '--format-command']);
    });

    it('prunes cli:false subtrees without affecting other fields', () => {
        const schema = z.object({
            enabled: z.boolean().meta({ cli: false }).optional(),
            visible: z.string(),
            nested: z.object({ hidden: z.string().meta({ cli: false }), shown: z.number() }),
        });
        expect(generateConfigCliOptions(schema).options.map(def => def.path)).toEqual([
            'visible',
            'nested.shown',
        ]);
    });

    it('emits scalar arrays but skips arrays of objects', () => {
        const schema = z.object({
            tags: z.array(z.string()).describe('Tags'),
            rows: z.array(z.object({ name: z.string() })),
        });
        const defs = generateConfigCliOptions(schema).options;
        expect(defs.map(def => def.path)).toEqual(['tags']);
        expect(defs[0]?.multiple).toBe(true);
    });

    it('skips primitive-only unions unless cli metadata opts in', () => {
        const schema = z.object({
            mode: z.union([z.literal('a'), z.literal('b')]),
            auto: z.union([z.boolean(), z.object({ include: z.array(z.string()) })]).meta({
                cli: { flag: '--auto', type: 'boolean' },
            }),
        });
        const defs = generateConfigCliOptions(schema).options;
        expect(defs.map(def => def.flag)).toEqual(['--auto-include', '--auto']);
        expect(defs[1]?.type).toBe('boolean');
    });

    it('deduplicates compatible union paths and reports conflicts', () => {
        const compatible = z.union([
            z.object({ port: z.number().describe('Port') }),
            z.object({ port: z.number().describe('Port') }),
        ]);
        const conflict = z.union([
            z.object({ port: z.number().describe('First') }),
            z.object({ port: z.number().describe('Second') }),
        ]);
        const ok = generateConfigCliOptions(compatible);
        expect(ok.options.map(def => def.path)).toEqual(['port']);
        expect(ok.diagnostics).toEqual([]);

        const bad = generateConfigCliOptions(conflict);
        expect(bad.options).toEqual([]);
        expect(bad.diagnostics[0]).toMatchObject({ path: 'port', kind: 'ambiguous-union' });
    });

    it('emits every field that reuses the same schema object', () => {
        const shared = z.string().describe('Value');
        const schema = z.object({ first: shared, second: shared });
        expect(generateConfigCliOptions(schema).options.map(def => def.path)).toEqual([
            'first',
            'second',
        ]);
    });

    it('keeps hidden options registered but out of the docs', () => {
        const schema = z.object({
            secret: z.string().meta({ cli: { hidden: true } }),
        });
        const def = generateConfigCliOptions(schema).options[0];
        expect(def?.flag).toBe('--secret');
        expect(def?.hidden).toBe(true);
    });

    it('exposes command metadata and skips cliCommand:false scopes', () => {
        const engine = createConfigEngine({
            schema: {
                serve: z.object({ port: z.number().default(3000) }).meta({
                    cliCommand: { name: 'run', description: 'Run it', aliases: ['r'] },
                }),
                internal: z.object({ x: z.string() }).meta({ cliCommand: false }),
            },
        });
        const { commands } = engine.cli.program.create(() => []);
        expect(commands.map(command => command.name)).toEqual(['run']);
        expect(commands[0]).toMatchObject({ description: 'Run it', aliases: ['r'] });
    });
});

describe('schema-driven program generation', () => {
    const schema = {
        serve: z.object({
            port: z.number().default(3000),
            host: z.string().default('localhost'),
            debug: z.boolean().default(false),
            aliases: z.boolean().default(true),
        }),
    };

    it('resolves loaded config → env → CLI → overrides and validates it', async () => {
        process.env.DBXTEST_PORT = '5000';
        const engine = createConfigEngine({ schema, envPrefix: 'DBX_' });
        const seen: unknown[] = [];
        const {
            commands: [command],
        } = engine.cli.program.create(cmd => [
            cmd('serve', {
                name: 'serve',
                description: 'Serve',
                overrides: { host: 'override.local' },
                run: ({ config }) => {
                    expectTypeOf(config).toEqualTypeOf<{
                        port: number;
                        host: string;
                        debug: boolean;
                        aliases: boolean;
                    }>();
                    seen.push(config);
                },
            }),
        ]);
        expect(command?.options?.map((option: { flags: string }) => option.flags)).toEqual([
            '--port <value>',
            '--host <value>',
            '--debug',
            '--aliases',
        ]);
        await command!.run({ port: 4000, aliases: false }, {
            config: { serve: { debug: true } },
        } as never);
        expect(seen[0]).toEqual({
            port: 4000,
            host: 'override.local',
            debug: true,
            aliases: false,
        });
    });

    it('maps negated flags to their positive config key', async () => {
        const engine = createConfigEngine({ schema, envPrefix: 'DBX_' });
        const seen: unknown[] = [];
        const {
            commands: [command],
        } = engine.cli.program.create(cmd => [
            cmd('serve', {
                name: 'serve',
                run: ({ config }) => {
                    seen.push(config);
                },
            }),
        ]);
        await command!.run({ aliases: false }, { config: {} } as never);
        expect(seen[0]).toMatchObject({ aliases: false });
    });

    it('appends runtime options and maps explicit runtime paths', async () => {
        const engine = createConfigEngine({ schema, envPrefix: 'DBX_' });
        const seen: unknown[] = [];
        const {
            commands: [command],
        } = engine.cli.program.create(cmd => [
            cmd('serve', {
                name: 'serve',
                options: [
                    { flags: '--json', description: 'JSON output' },
                    {
                        flags: '--listen <port>',
                        description: 'Listen port',
                        path: 'port',
                        type: 'number',
                    },
                ],
                run: ({ config, values }) => {
                    seen.push({ config, values });
                },
            }),
        ]);
        expect(command?.options?.map(option => option.flags)).toContain('--json');
        await command!.run({ listen: 7000, json: true }, { config: {} } as never);
        expect(seen[0]).toMatchObject({ config: { port: 7000 }, values: { json: true } });
    });

    it('does not expose env vars for values marked envExpose:false', async () => {
        process.env.DBX_PORT = '9999';
        const engine = createConfigEngine({
            schema: {
                serve: z.object({
                    port: z.number().default(3000).meta({
                        envName: 'DBX_PORT',
                        envExpose: false,
                    }),
                }),
            },
            envPrefix: 'DBX_',
        });
        const seen: unknown[] = [];
        const {
            commands: [command],
        } = engine.cli.program.create(cmd => [
            cmd('serve', {
                run: ({ config }) => {
                    seen.push(config);
                },
            }),
        ]);
        expect(engine.cli.options().command.serve?.options[0]?.env).toBeUndefined();
        await command!.run({}, { config: {} } as never);
        expect(seen[0]).toEqual({ port: 3000 });
    });

    it('infers runtime option values in configCliCommand', async () => {
        const seen: unknown[] = [];
        const command = configCliCommand({
            name: 'serve',
            description: 'Serve',
            schema: z.object({ port: z.number().default(3000) }),
            options: [
                { flags: '--json', description: 'JSON output' },
                { flags: '--cwd <dir>', description: 'Project root' },
                { flags: '--tag <value...>', description: 'Tags' },
                { flags: '--no-color', description: 'Disable colour' },
                { flags: '--limit <count>', description: 'Limit', type: 'number' },
            ],
            run: values => {
                expectTypeOf(values.json).toEqualTypeOf<boolean | undefined>();
                expectTypeOf(values.cwd).toEqualTypeOf<string | undefined>();
                expectTypeOf(values.tag).toEqualTypeOf<string[] | undefined>();
                expectTypeOf(values.color).toEqualTypeOf<boolean | undefined>();
                expectTypeOf(values.limit).toEqualTypeOf<number | undefined>();
                seen.push(values);
            },
        });
        await command.run({ json: true, cwd: 'x', tag: ['a'], color: false, limit: 2 }, {
            config: {},
        } as never);
        expect(seen[0]).toMatchObject({ json: true, limit: 2 });
    });

    it('infers runtime option values in an inline single command', async () => {
        const engine = createConfigEngine({ schema, envPrefix: 'DBX_' });
        const seen: unknown[] = [];
        const {
            commands: [command],
        } = engine.cli.program.create<CliCommandContext & { extra: string }>(cmd => [
            cmd('serve', {
                options: [
                    { flags: '--json', description: 'JSON output' },
                    { flags: '--only <tasks>', description: 'Tasks' },
                    { flags: '--tag <value...>', description: 'Tags' },
                ],
                run: ({ values, context }) => {
                    expectTypeOf(values.json).toEqualTypeOf<boolean | undefined>();
                    expectTypeOf(values.only).toEqualTypeOf<string | undefined>();
                    expectTypeOf(values.tag).toEqualTypeOf<string[] | undefined>();
                    expectTypeOf(context.extra).toEqualTypeOf<string>();
                    seen.push(values);
                },
            }),
        ]);
        await command!.run({ json: true, only: 'tsconfig', tag: ['a'] }, { config: {} } as never);
        expect(seen[0]).toMatchObject({ json: true, only: 'tsconfig', tag: ['a'] });
    });

    it('infers runtime option values and overrides in program commands', async () => {
        const engine = createConfigEngine({ schema, envPrefix: 'DBX_' });
        const seen: unknown[] = [];
        const {
            commands: [generated],
        } = engine.cli.program.create(cmd => [
            cmd('serve', {
                options: [
                    { flags: '--json', description: 'JSON output' },
                    { flags: '--tag <value...>', description: 'Tags' },
                    { flags: '--no-color', description: 'Disable colour' },
                ],
                overrides: values => {
                    expectTypeOf(values.json).toEqualTypeOf<boolean | undefined>();
                    expectTypeOf(values.tag).toEqualTypeOf<string[] | undefined>();
                    expectTypeOf(values.color).toEqualTypeOf<boolean | undefined>();
                    return { debug: values.json === true };
                },
                run: ({ config, values }) => {
                    expectTypeOf(values.json).toEqualTypeOf<boolean | undefined>();
                    expectTypeOf(values.tag).toEqualTypeOf<string[] | undefined>();
                    expectTypeOf(values.color).toEqualTypeOf<boolean | undefined>();
                    seen.push({ config, values });
                },
            }),
        ]);
        await generated!.run({ json: true, tag: ['a'], color: false }, {
            config: { serve: {} },
        } as never);
        expect(seen[0]).toMatchObject({
            config: { debug: true },
            values: { json: true, tag: ['a'], color: false },
        });
    });

    it('supports the chained command API and subcommands', async () => {
        const engine = createConfigEngine({ schema, envPrefix: 'DBX_' });
        const seen: unknown[] = [];
        const {
            commands: [command],
        } = engine.cli.program.create(cmd => [
            cmd('serve')
                .description('Serve.')
                .version('1.2.3')
                .option({ flags: '--json', description: 'JSON output.' })
                .option({ flags: '--tag <value...>', description: 'Tags.' })
                .onError(() => {})
                .command('serve', sub =>
                    sub
                        .name('status')
                        .description('Status.')
                        .option({ flags: '--short', description: 'Short output.' })
                        .run(({ config, values, context }) => {
                            expectTypeOf(values.short).toEqualTypeOf<boolean | undefined>();
                            expectTypeOf(config).toEqualTypeOf<{
                                port: number;
                                host: string;
                                debug: boolean;
                                aliases: boolean;
                            }>();
                            expectTypeOf(context).toEqualTypeOf<CliCommandContext>();
                            seen.push({ config, values });
                        })
                )
                .run(({ values }) => {
                    expectTypeOf(values.json).toEqualTypeOf<boolean | undefined>();
                    expectTypeOf(values.tag).toEqualTypeOf<string[] | undefined>();
                    seen.push(values);
                }),
        ]);
        expect(command?.version).toBe('1.2.3');
        expect(command?.commands?.[0]?.name).toBe('status');
        await command!.run({ json: true, tag: ['a'] }, { config: {} } as never);
        expect(seen[0]).toMatchObject({ json: true, tag: ['a'] });
    });

    it('supports a single-schema engine without a scope wrapper', async () => {
        const engine = createConfigEngine({
            schema: z.object({ port: z.number().default(3000) }),
            envPrefix: 'DBX_',
        });
        const seen: unknown[] = [];
        const {
            commands: [command],
        } = engine.cli.program.create(cmd => [
            cmd('config', {
                name: 'serve',
                run: ({ config }) => void seen.push(config),
            }),
        ]);
        await command!.run({}, { config: {} } as never);
        expect(seen[0]).toEqual({ port: 3000 });
    });
});

describe('standalone program generation', () => {
    it('accepts plain command specs and resolves their scoped config', async () => {
        const schema = {
            serve: z.object({ port: z.number().default(3000) }),
        };
        const seen: unknown[] = [];
        const commands = generateConfigProgram(schema, {
            envPrefix: 'DBX_',
            commands: [
                {
                    scope: 'serve',
                    name: 'serve',
                    description: 'Serve.',
                    run: ({ config, values }) => {
                        seen.push({ config, values });
                    },
                },
            ],
        });
        expect(commands.map(command => command.name)).toEqual(['serve']);
        await commands[0]!.run(
            { port: 4000 },
            { config: { serve: { port: 5000 } } } as never
        );
        expect(seen[0]).toMatchObject({
            config: { port: 4000 },
            values: { port: 4000 },
        });
    });
});
