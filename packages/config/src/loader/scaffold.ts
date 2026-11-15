/** Create a starter config file (`dbx.config.ts` by default). */

import fs from 'node:fs';
import path from 'node:path';

/** Options for {@link createConfigFile}. */
export interface CreateConfigFileOptions {
    /** The directory to write the file to (default `process.cwd()`). */
    cwd?: string;
    /** The file name (default `dbx.config.ts`). */
    name?: string;
    /** Extra import lines (eg. `import { z } from 'zod';`). */
    imports?: string[];
    /** The body passed to `defineConfig` (default `{ toolchain: {} }`). */
    content?: string;
    /** Overwrite an existing file (default false). */
    overwrite?: boolean;
    /** The `defineConfig` import specifier (default `@deltabox/toolchain/shared`). */
    defineConfigImport?: string;
}

/** Create a config file and return its absolute path. */
export function createConfigFile(options: CreateConfigFileOptions = {}): string {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const file = path.join(cwd, options.name ?? 'dbx.config.ts');
    if (fs.existsSync(file) && options.overwrite !== true) {
        throw new Error(`Config file already exists: ${file}`);
    }
    const imports = [
        `import { defineConfig } from '${options.defineConfigImport ?? '@deltabox/toolchain/shared'}';`,
        ...(options.imports ?? []),
    ];
    const content = (options.content ?? '{ toolchain: {} }').trim();
    const body = content
        .split('\n')
        .map(line => (line ? `    ${line}` : line))
        .join('\n');
    const source = `${imports.join('\n')}\n\nexport default defineConfig(${body});\n`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source, 'utf-8');
    return file;
}
