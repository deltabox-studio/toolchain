/**
 * Env type generator. Produces an `env.ts` (the `AppEnv` / `AppViteEnv`
 * interfaces) and an ambient `.d.ts` (wiring them onto `process.env` and
 * `import.meta.env`) from the collected env vars.
 */

import fs from 'node:fs';
import path from 'node:path';

import { type CollectVarsOptions, collectVars, DEFAULT_ENV_PREFIX } from '../collect.js';
import type { ConfigSchema } from '../types.js';

export interface GenerateEnvTypesOptions {
    /** Output directory. When omitted, nothing is written. */
    outputDir?: string | false;
    /** The env-var prefix (default `APP_`). */
    envPrefix?: string;
    /** The `process.env` interface name (default `AppEnv`). */
    envInterfaceName?: string;
    /** The `import.meta.env` interface name (default `AppViteEnv`). */
    viteEnvInterfaceName?: string;
    /** The generated types file name (default `env.ts`). */
    envFile?: string;
    /** The generated ambient file name (default `env.d.ts`). */
    dtsFile?: string;
    /** The import specifier the `.d.ts` uses for the env types. */
    importPath?: string;
    /** A header comment prepended to both files. */
    header?: string;
    /** A raw (verbatim) header replacing the generated one in `env.ts`. */
    envHeader?: string;
    /** A raw (verbatim) header replacing the generated one in the `.d.ts`. */
    dtsHeader?: string;
    /** The doc comment above the `process.env` interface. */
    envComment?: string;
    /** Add a `declare module 'vite'` augmentation to the `.d.ts`. */
    augmentVite?: boolean;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectVarsOptions['envPathOf'];
}

function headerComment(custom?: string): string {
    return custom ?? 'Generated env typing — DO NOT EDIT.';
}

/** Render the `env.ts` content (the env + vite-env interfaces). */
export function generateEnv(schema: ConfigSchema, options: GenerateEnvTypesOptions = {}): string {
    const envPrefix = options.envPrefix ?? DEFAULT_ENV_PREFIX;
    const envInterface = options.envInterfaceName ?? 'AppEnv';
    const viteEnvInterface = options.viteEnvInterfaceName ?? 'AppViteEnv';

    const vars = collectVars(schema, envPrefix, { envPathOf: options.envPathOf }).filter(
        def => def.name
    );
    const serverVars = vars.filter(def => def.scope !== 'frontend');
    const viteVars = vars.filter(def => def.public);

    const lines: string[] = options.envHeader
        ? [options.envHeader, '']
        : [`/**`, ` * ${headerComment(options.header)}`, ` */`, ''];
    lines.push(
        `/** ${options.envComment ?? 'Environment variables typed on `process.env`.'} */`,
        `export interface ${envInterface} {`
    );
    for (const def of serverVars) {
        lines.push(`    /** ${(def.description ?? '').replace(/\n/g, ' ')} */`);
        lines.push(`    ${def.name}?: string;`);
    }
    lines.push('}');
    lines.push('');
    lines.push('/** Public frontend environment variables typed on `import.meta.env`. */');
    lines.push(`export interface ${viteEnvInterface} {`);
    for (const def of viteVars) {
        lines.push(`    /** ${(def.description ?? '').replace(/\n/g, ' ')} */`);
        lines.push(`    ${def.name}?: string;`);
    }
    lines.push('}');
    return `${lines.join('\n').trimEnd()}\n`;
}

/** Render the ambient `.d.ts` content. */
export function generateEnvDts(options: GenerateEnvTypesOptions = {}): string {
    const envInterface = options.envInterfaceName ?? 'AppEnv';
    const viteEnvInterface = options.viteEnvInterfaceName ?? 'AppViteEnv';
    const importPath = options.importPath ?? './env.js';
    const header = options.dtsHeader
        ? `${options.dtsHeader}\n`
        : `/**
 * ${headerComment(options.header)}
 *
 * Re-exports the generated env types onto \`process.env\` and
 * \`import.meta.env\` so environment variables type-check everywhere.
 */
`;
    const viteModule = options.augmentVite
        ? `

declare module 'vite' {
    interface ImportMetaEnv extends ${viteEnvInterface} {}
}`
        : '';
    return `${header}import type { ${envInterface}, ${viteEnvInterface} } from '${importPath}';

declare global {
    namespace NodeJS {
        interface ProcessEnv extends ${envInterface} {}
    }

    interface ImportMetaEnv extends ${viteEnvInterface} {}
}${viteModule}

export {};
`;
}

/** Generate env type file contents (and optionally write them). */
export function generateConfigEnv(
    schema: ConfigSchema,
    options: GenerateEnvTypesOptions = {}
): Record<string, string> {
    const envFile = options.envFile ?? 'env.ts';
    const dtsFile = options.dtsFile ?? 'env.d.ts';
    const contents = {
        [envFile]: generateEnv(schema, options),
        [dtsFile]: generateEnvDts(options),
    };
    if (typeof options.outputDir === 'string') {
        fs.mkdirSync(options.outputDir, { recursive: true });
        for (const [file, content] of Object.entries(contents)) {
            fs.writeFileSync(path.join(options.outputDir, file), content, 'utf-8');
        }
    }
    return contents;
}

/** @deprecated Use {@link generateConfigEnv}. */
export const generateEnvTypes = generateConfigEnv;
