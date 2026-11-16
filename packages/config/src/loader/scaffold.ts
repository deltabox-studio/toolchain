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
    const name = (options.name ?? 'dbx.config.ts').trim();
    if (!name || name === '.' || name === '..') {
        throw new Error('Config file name must be a file name, not a directory.');
    }
    const file = path.resolve(cwd, name);
    const relative = path.relative(cwd, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Config file must stay inside ${cwd} (got ${file}).`);
    }
    if (file === cwd || (fs.existsSync(file) && fs.statSync(file).isDirectory())) {
        throw new Error(`Config target is a directory: ${file}`);
    }
    if (fs.existsSync(file) && options.overwrite !== true) {
        throw new Error(`Config file already exists: ${file}`);
    }
    const imports = [
        `import { defineConfig } from '${options.defineConfigImport ?? '@deltabox/toolchain/shared'}';`,
        ...(options.imports ?? []),
    ];
    const content = (options.content ?? '').trim() || '{ toolchain: {} }';
    const source = `${imports.join('\n')}\n\nexport default defineConfig(${content});\n`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source, 'utf-8');
    return file;
}
