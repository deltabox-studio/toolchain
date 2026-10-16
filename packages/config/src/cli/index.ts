/**
 * Framework-agnostic config commands. A consumer builds an engine with
 * `createConfigEngine`, then exposes these on its CLI:
 *
 * ```ts
 * import { configCommands } from '@deltabox/toolchain-config/cli';
 * program.addCommand(...)
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';

import { logger, type ToolingCommand } from '@deltabox/toolchain-shared';

import type { ConfigEngine } from '../engine.js';

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
export function configCommands(ctx: ConfigCommandContext): ToolingCommand[] {
    const { engine } = ctx;
    const d = ctx.defaults ?? {};

    return [
        {
            name: 'config:env',
            description: 'Generate .env.example from the config schemas.',
            options: [{ flags: '-o, --out <dir>', description: 'Output directory.' }],
            run: ({ out }) => {
                const output = path.join(
                    resolve(out as string | undefined, d.envDir ?? engine.root),
                    '.env.example'
                );
                engine.writeEnvFile({ output });
                logger.info(`Generated ${path.relative(process.cwd(), output)}`);
            },
        },
        {
            name: 'config:types',
            description: 'Generate the config and env types.',
            options: [
                { flags: '-o, --out <dir>', description: 'Output directory.' },
                { flags: '--env', description: 'Also write the env type files.' },
            ],
            run: ({ out, env }) => {
                const outDir = resolve(out as string | undefined, d.typesDir ?? engine.root);
                const written = engine.writeConfigTypes({ outputDir: outDir });
                if (env) written.push(...engine.writeEnvTypes({ outputDir: outDir }));
                for (const file of written)
                    logger.info(`Generated ${path.relative(process.cwd(), file)}`);
            },
        },
        {
            name: 'config:json',
            description: 'Generate the config metadata JSON.',
            options: [{ flags: '-o, --out <file>', description: 'Output file.' }],
            run: ({ out }) => {
                const output = resolve(
                    out as string | undefined,
                    d.configJsonPath ?? path.join(engine.root, 'config.json')
                );
                const doc = engine.buildConfigJson();
                fs.mkdirSync(path.dirname(output), { recursive: true });
                fs.writeFileSync(output, `${JSON.stringify(doc, null, 4)}\n`, 'utf-8');
                logger.info(`Generated ${path.relative(process.cwd(), output)}`);
            },
        },
        {
            name: 'config:schema',
            description: 'Generate the untyped JSON Schema.',
            options: [{ flags: '-o, --out <file>', description: 'Output file.' }],
            run: async ({ out }) => {
                const output = resolve(
                    out as string | undefined,
                    d.schemaPath ?? path.join(engine.root, 'config.schema.json')
                );
                await engine.writeJsonSchema({ output });
                logger.info(`Generated ${path.relative(process.cwd(), output)}`);
            },
        },
        {
            name: 'config:markdown',
            description: 'Generate the markdown configuration reference.',
            options: [{ flags: '-o, --out <dir>', description: 'Output directory.' }],
            run: ({ out }) => {
                const outDir = resolve(
                    out as string | undefined,
                    d.docsDir ?? path.join(engine.root, 'docs/reference/configuration')
                );
                const written = engine.writeMarkdown({ outDir });
                for (const file of written)
                    logger.info(`Generated ${path.relative(process.cwd(), file)}`);
            },
        },
        {
            name: 'config:cli',
            description: 'Generate the CLI options JSON.',
            options: [{ flags: '-o, --out <file>', description: 'Output file.' }],
            run: ({ out }) => {
                const output = resolve(
                    out as string | undefined,
                    d.cliOptionsPath ?? path.join(engine.root, 'cli-options.json')
                );
                engine.generateCliOptions({ output });
                logger.info(`Generated ${path.relative(process.cwd(), output)}`);
            },
        },
        {
            name: 'config:all',
            description: 'Run every config generator.',
            options: [{ flags: '-o, --out <dir>', description: 'Base output directory.' }],
            run: async ({ out }) => {
                const base = resolve(out as string | undefined, engine.root);
                const written: string[] = [];
                written.push(engine.writeEnvFile({ output: path.join(base, '.env.example') }));
                written.push(
                    ...engine.writeConfigTypes({ outputDir: path.join(base, 'types') }),
                    ...engine.writeEnvTypes({ outputDir: path.join(base, 'types') }),
                    ...engine.writeMarkdown({
                        outDir: path.join(base, 'docs/reference/configuration'),
                    })
                );
                written.push(
                    await engine.writeJsonSchema({ output: path.join(base, 'config.schema.json') })
                );
                written.push(
                    engine.generateCliOptions({
                        output: path.join(base, 'cli-options.json'),
                    }) as unknown as string
                );
                for (const file of written.filter(f => typeof f === 'string')) {
                    logger.info(`Generated ${path.relative(process.cwd(), file)}`);
                }
            },
        },
    ];
}
