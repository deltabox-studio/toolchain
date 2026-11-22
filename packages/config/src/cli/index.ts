/**
 * Framework-agnostic config commands. A consumer builds an engine with
 * `createConfigEngine`, then exposes these on its CLI:
 *
 * ```ts
 * import { configCommands } from '@deltabox/toolchain/config';
 * program.addCommand(...)
 * ```
 *
 * Deliberately library-only: the `dbx` root CLI does not register a `config:*`
 * group, because every command needs a consumer-bound {@link ConfigEngine}.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
    defineCliCommand,
    logger,
    type ToolchainCommandContext,
    withSpinner,
} from '@deltabox/toolchain/shared';

import type { ConfigEngine } from '../types/engine.js';

export * from './format.js';
export * from './program/index.js';

/** Default output locations for the config commands. */
export interface ConfigCommandDefaults {
    /** Where `.env.example[.dev]` are written (default: engine root). */
    envDir?: string;
    /** Where the config + env types are written. */
    typesDir?: string;
    /** Where the markdown reference is written. */
    docsDir?: string;
    /** The JSON Schema output path. */
    schemaPath?: string;
    /** The config metadata output path. */
    configJsonPath?: string;
    /** The CLI options output path. */
    cliOptionsPath?: string;
}

export interface ConfigCommandContext {
    engine: ConfigEngine;
    defaults?: ConfigCommandDefaults;
}

function resolve(value: string | undefined, fallback: string): string {
    return path.resolve(value ?? fallback);
}

/** Build the config commands bound to a consumer's engine. */
export function configCommands(ctx: ConfigCommandContext) {
    const { engine } = ctx;
    const d = ctx.defaults ?? {};

    const commands = [
        defineCliCommand({
            name: 'config:env',
            description: 'Generate .env.example from the config schemas.',
            options: [{ flags: '-o, --out <dir>', description: 'Output directory.' }],
            run: ({ out }) => {
                const output = path.join(
                    resolve(out as string | undefined, d.envDir ?? engine.root),
                    '.env.example'
                );
                engine.env.write({ output });
                logger.info(`Generated ${path.relative(process.cwd(), output)}`);
            },
        }),
        defineCliCommand({
            name: 'config:types',
            description: 'Generate the config and env types.',
            options: [
                { flags: '-o, --out <dir>', description: 'Output directory.' },
                { flags: '--env', description: 'Also write the env type files.' },
            ],
            run: ({ out, env }) => {
                const outDir = resolve(
                    out as string | undefined,
                    d.typesDir ?? path.join(engine.root, 'types')
                );
                const written = engine.types.write({ outputDir: outDir });
                if (env) written.push(...engine.env.types.write({ outputDir: outDir }));
                for (const file of written)
                    logger.info(`Generated ${path.relative(process.cwd(), file)}`);
            },
        }),
        defineCliCommand({
            name: 'config:json',
            description: 'Generate the config metadata JSON.',
            options: [{ flags: '-o, --out <file>', description: 'Output file.' }],
            run: ({ out }) => {
                const output = resolve(
                    out as string | undefined,
                    d.configJsonPath ?? path.join(engine.root, 'config.json')
                );
                const doc = engine.configJson.build();
                fs.mkdirSync(path.dirname(output), { recursive: true });
                fs.writeFileSync(output, `${JSON.stringify(doc, null, 4)}\n`, 'utf-8');
                logger.info(`Generated ${path.relative(process.cwd(), output)}`);
            },
        }),
        defineCliCommand({
            name: 'config:schema',
            description: 'Generate the untyped JSON Schema.',
            options: [{ flags: '-o, --out <file>', description: 'Output file.' }],
            run: async ({ out }) => {
                const output = resolve(
                    out as string | undefined,
                    d.schemaPath ?? path.join(engine.root, 'config.schema.json')
                );
                await engine.jsonSchema.write({ output });
                logger.info(`Generated ${path.relative(process.cwd(), output)}`);
            },
        }),
        defineCliCommand({
            name: 'config:markdown',
            description: 'Generate the markdown configuration reference.',
            options: [{ flags: '-o, --out <dir>', description: 'Output directory.' }],
            run: ({ out }) => {
                const outDir = resolve(
                    out as string | undefined,
                    d.docsDir ?? path.join(engine.root, 'docs/reference/configuration')
                );
                const written = engine.markdown.write({ outputDir: outDir });
                for (const file of written)
                    logger.info(`Generated ${path.relative(process.cwd(), file)}`);
            },
        }),
        defineCliCommand({
            name: 'config:cli',
            description: 'Generate the CLI options JSON.',
            options: [{ flags: '-o, --out <file>', description: 'Output file.' }],
            run: ({ out }) => {
                const output = resolve(
                    out as string | undefined,
                    d.cliOptionsPath ?? path.join(engine.root, 'cli-options.json')
                );
                engine.cli.write({ output });
                logger.info(`Generated ${path.relative(process.cwd(), output)}`);
            },
        }),
        defineCliCommand({
            name: 'config:all',
            description: 'Run every config generator.',
            options: [{ flags: '-o, --out <dir>', description: 'Base output directory.' }],
            run: async ({ out }) => {
                const base = out === undefined ? undefined : path.resolve(out as string);
                const typesDir = base
                    ? path.join(base, 'types')
                    : resolve(d.typesDir, path.join(engine.root, 'types'));
                const docsDir = base
                    ? path.join(base, 'docs/reference/configuration')
                    : resolve(d.docsDir, path.join(engine.root, 'docs/reference/configuration'));
                const schemaPath = base
                    ? path.join(base, 'config.schema.json')
                    : resolve(d.schemaPath, path.join(engine.root, 'config.schema.json'));
                const configJsonPath = base
                    ? path.join(base, 'config.json')
                    : resolve(d.configJsonPath, path.join(engine.root, 'config.json'));
                const cliOptionsPath = base
                    ? path.join(base, 'cli-options.json')
                    : resolve(d.cliOptionsPath, path.join(engine.root, 'cli-options.json'));
                const envDir = base ? base : resolve(d.envDir, engine.root);

                const written: string[] = [
                    engine.env.write({ output: path.join(envDir, '.env.example') }),
                    ...engine.types.write({ outputDir: typesDir }),
                    ...engine.env.types.write({ outputDir: typesDir }),
                    ...engine.markdown.write({ outputDir: docsDir }),
                    await engine.jsonSchema.write({ output: schemaPath }),
                ];
                fs.mkdirSync(path.dirname(configJsonPath), { recursive: true });
                fs.writeFileSync(
                    configJsonPath,
                    `${JSON.stringify(engine.configJson.build(), null, 4)}\n`,
                    'utf-8'
                );
                written.push(configJsonPath);
                fs.mkdirSync(path.dirname(cliOptionsPath), { recursive: true });
                engine.cli.write({ output: cliOptionsPath });
                written.push(cliOptionsPath);

                for (const file of written) {
                    logger.info(`Generated ${path.relative(process.cwd(), file)}`);
                }
            },
        }),
    ];

    return commands.map(command => ({
        ...command,
        run: (args: Record<string, unknown>, context: ToolchainCommandContext) =>
            withSpinner(() => Promise.resolve(command.run(args as never, context)), {
                start: command.description,
                success: command.description,
            }),
    }));
}
