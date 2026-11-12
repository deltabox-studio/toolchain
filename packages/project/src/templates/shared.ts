import type { GeneratedFile } from '@deltabox/toolchain/shared';
import { renderTsconfigDefault } from '@deltabox/toolchain/tsconfig';

import { createRootProjectFiles, type ProjectContext } from '../typescript.js';

export const TSX = {
    dev: 'tsx watch src/index.ts',
    build: 'vp pack',
    start: 'node dist/index.js',
    test: 'vp test',
} as const;

/** The Bun scripts shared by the Bun templates. */
export const BUN = {
    dev: 'bun --watch src/index.ts',
    build: 'bun build src/index.ts --outdir dist --target bun',
    start: 'bun src/index.ts',
    test: 'bun test',
} as const;

/** The dependencies of the current template ecosystem (checked 2026-11). */
export const VERSIONS = {
    express: '^5.3.0',
    '@types/express': '^5.0.6',
    fastify: '^5.12.8',
    '@orpc/server': '^1.16.1',
    zod: '^4.3.0',
    '@aws-sdk/client-s3': '^3.1165.0',
    '@types/bun': '^1.4.4',
    tsx: '^4.23.15',
    vitepress: '^1.6.4',
} as const;

/** A generated file (path + content). */
export function file(path: string, content: string): GeneratedFile {
    return { path, content };
}

/** A template recipe: files/deps/scripts layered over the base scaffold. */
export interface Recipe {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    files?: GeneratedFile[];
    remove?: string[];
    application?: boolean;
}

/** The default tsconfig with the Bun globals added to `types`. */
export function bunTsconfig(ctx: ProjectContext): GeneratedFile {
    const template = JSON.parse(renderTsconfigDefault({ name: ctx.name })) as {
        compilerOptions?: Record<string, unknown>;
    };
    template.compilerOptions = { ...template.compilerOptions, types: ['node', 'bun'] };
    return file('tsconfig.default.json', `${JSON.stringify(template, null, 4)}\n`);
}

/** Build a recipe over the standard root scaffold. */
export function recipe(ctx: ProjectContext, spec: Recipe): GeneratedFile[] {
    const base = createRootProjectFiles({
        ...ctx,
        kind: spec.application ? 'application' : 'project',
        ...(spec.dependencies ? { dependencies: spec.dependencies } : {}),
        ...(spec.devDependencies ? { extraDevDependencies: spec.devDependencies } : {}),
        ...(spec.scripts ? { scripts: spec.scripts } : {}),
    });
    const files = new Map(base.map(entry => [entry.path, entry]));
    for (const path of spec.remove ?? []) files.delete(path);
    for (const entry of spec.files ?? []) files.set(entry.path, entry);
    return [...files.values()];
}

/** The README for a template, with an optional "requirements" section. */
export function readme(name: string, summary: string, extra: string | string[] = ''): string {
    const lines = Array.isArray(extra) ? extra : extra ? [extra] : [];
    return [
        `# ${name}`,
        '',
        summary,
        '',
        '```sh',
        'yarn install',
        'yarn dev',
        '```',
        ...(lines.length > 0 ? ['', ...lines] : []),
        '',
    ].join('\n');
}

export const CONTENT_TYPES = [
    'const CONTENT_TYPES: Record<string, string> = {',
    "    '.css': 'text/css; charset=utf-8',",
    "    '.html': 'text/html; charset=utf-8',",
    "    '.js': 'text/javascript; charset=utf-8',",
    "    '.json': 'application/json; charset=utf-8',",
    "    '.md': 'text/markdown; charset=utf-8',",
    "    '.png': 'image/png',",
    "    '.svg': 'image/svg+xml',",
    "    '.txt': 'text/plain; charset=utf-8',",
    '};',
    '',
    'export function contentType(pathname: string): string {',
    '    const extension = pathname.slice(pathname.lastIndexOf(".")).toLowerCase();',
    "    return CONTENT_TYPES[extension] ?? 'application/octet-stream';",
    '}',
].join('\n');
