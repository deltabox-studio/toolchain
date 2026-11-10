/**
 * Quality-of-life builtin templates: docs sites, HTTP servers, file servers and
 * a local LLM chat UI. Each recipe starts from the standard TypeScript scaffold
 * (package.json, tsconfig, `vite.config.ts` with the `dbx()` plugin, Oxc config)
 * and layers template-specific dependencies, scripts, tasks and source files on
 * top, so every template respects the selected package manager, catalogs and
 * formatter/linter setup.
 */

import type { GeneratedFile } from '@deltabox/toolchain/shared';
import { renderTsconfigDefault } from '@deltabox/toolchain/tsconfig';

import { createRootProjectFiles, type ProjectContext, renderGitignore } from './typescript.js';

/** The ids of the quality-of-life builtin templates. */
export const QOL_TEMPLATE_IDS = [
    'vitepress',
    'express',
    'bun',
    'fastify',
    'orpc',
    'file-server',
    'file-server-s3',
    'file-server-bun-s3',
    'file-server-minio',
    'file-server-rclone',
    'ollama-chat',
] as const;

/** A quality-of-life builtin template id. */
export type QolTemplateId = (typeof QOL_TEMPLATE_IDS)[number];

/** Whether a value is a quality-of-life builtin template id. */
export function isQolTemplateId(value: string): value is QolTemplateId {
    return (QOL_TEMPLATE_IDS as readonly string[]).includes(value);
}

/** The `tsx` scripts/tasks shared by the Node server templates. */
const TSX = {
    dev: 'tsx watch src/index.ts',
    build: 'vp pack',
    start: 'node dist/index.js',
    test: 'vp test',
} as const;

/** The Bun scripts/tasks shared by the Bun templates. */
const BUN = {
    dev: 'bun --watch src/index.ts',
    build: 'bun build src/index.ts --outdir dist --target bun',
    start: 'bun src/index.ts',
    test: 'bun test',
} as const;

/** The dependencies of the current template ecosystem (checked 2026-11). */
const VERSIONS = {
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
function file(path: string, content: string): GeneratedFile {
    return { path, content };
}

/** A template recipe: files/deps/scripts layered over the base scaffold. */
interface Recipe {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    tasks?: Record<string, string>;
    files?: GeneratedFile[];
    remove?: string[];
    application?: boolean;
}

/** The default tsconfig with the Bun globals added to `types`. */
function bunTsconfig(ctx: ProjectContext): GeneratedFile {
    const template = JSON.parse(renderTsconfigDefault({ name: ctx.name })) as {
        compilerOptions?: Record<string, unknown>;
    };
    template.compilerOptions = { ...template.compilerOptions, types: ['node', 'bun'] };
    return file('tsconfig.default.json', `${JSON.stringify(template, null, 4)}\n`);
}

/** Build a recipe over the standard root scaffold. */
function recipe(ctx: ProjectContext, spec: Recipe): GeneratedFile[] {
    const base = createRootProjectFiles({
        ...ctx,
        kind: spec.application ? 'application' : 'project',
        ...(spec.dependencies ? { dependencies: spec.dependencies } : {}),
        ...(spec.devDependencies ? { extraDevDependencies: spec.devDependencies } : {}),
        ...(spec.scripts ? { scripts: spec.scripts } : {}),
        ...(spec.tasks ? { tasks: spec.tasks } : {}),
    });
    const files = new Map(base.map(entry => [entry.path, entry]));
    for (const path of spec.remove ?? []) files.delete(path);
    for (const entry of spec.files ?? []) files.set(entry.path, entry);
    return [...files.values()];
}

/** The README for a template, with an optional "requirements" section. */
function readme(name: string, summary: string, extra: string | string[] = ''): string {
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

function vitePress(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        devDependencies: { vitepress: VERSIONS.vitepress },
        scripts: {
            dev: 'vitepress dev docs',
            build: 'vitepress build docs',
            preview: 'vitepress preview docs',
            test: 'vp test',
        },
        tasks: {
            dev: 'vitepress dev docs',
            build: 'vitepress build docs',
            preview: 'vitepress preview docs',
            test: 'vp test',
        },
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(
                    ctx.name,
                    'A VitePress documentation site. Edit `docs/` and the sidebar in `docs/.vitepress/config.ts`.',
                    ['`yarn build` writes the static site to `docs/.vitepress/dist`.']
                )
            ),
            file(
                '.gitignore',
                `${renderGitignore()}docs/.vitepress/cache/\ndocs/.vitepress/dist/\n`
            ),
            file(
                'docs/index.md',
                [
                    '---',
                    'layout: home',
                    '',
                    'hero:',
                    `    name: ${ctx.name}`,
                    '    text: Documentation',
                    '    tagline: Everything you need to get started.',
                    '    actions:',
                    '        - theme: brand',
                    '          text: Get started',
                    '          link: /guide/getting-started',
                    '',
                    'features:',
                    '    - title: Fast',
                    '      details: Built on Vite and Vue.',
                    '    - title: Simple',
                    '      details: Write Markdown, get a static site.',
                    '---',
                    '',
                ].join('\n')
            ),
            file(
                'docs/guide/getting-started.md',
                [
                    '# Getting started',
                    '',
                    `Welcome to **${ctx.name}**.`,
                    '',
                    '1. Run `yarn dev` and open the printed URL.',
                    '2. Edit `docs/index.md` and `docs/guide/getting-started.md`.',
                    '3. Run `yarn build` to generate the static site.',
                    '',
                    '## Configuration',
                    '',
                    'The site title, description, navigation and sidebar live in',
                    '`docs/.vitepress/config.ts`.',
                    '',
                ].join('\n')
            ),
            file(
                'docs/.vitepress/config.ts',
                [
                    "import { defineConfig } from 'vitepress';",
                    '',
                    'export default defineConfig({',
                    `    title: '${ctx.name}',`,
                    `    description: 'Documentation for ${ctx.name}.',`,
                    '    cleanUrls: true,',
                    '    themeConfig: {',
                    '        nav: [{ text: "Guide", link: "/guide/getting-started" }],',
                    '        sidebar: [',
                    '            {',
                    '                text: "Guide",',
                    '                items: [',
                    '                    { text: "Getting started", link: "/guide/getting-started" },',
                    '                ],',
                    '            },',
                    '        ],',
                    '    },',
                    '});',
                    '',
                ].join('\n')
            ),
            file(
                'tests/config.test.ts',
                [
                    "import { describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import config from '../docs/.vitepress/config.js';",
                    '',
                    "describe('docs config', () => {",
                    "    it('names the site', () => {",
                    `        expect(config.title).toBe('${ctx.name}');`,
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

function express(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        dependencies: { express: VERSIONS.express },
        devDependencies: { '@types/express': VERSIONS['@types/express'], tsx: VERSIONS.tsx },
        scripts: TSX,
        tasks: TSX,
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(ctx.name, 'An Express 5 API server written in TypeScript.', [
                    '`GET /` and `GET /health` are included as a starting point.',
                ])
            ),
            file(
                'src/app.ts',
                [
                    "import express, { type Express } from 'express';",
                    '',
                    'export function createApp(): Express {',
                    '    const app = express();',
                    "    app.disable('x-powered-by');",
                    '    app.use(express.json());',
                    '',
                    "    app.get('/', (_req, res) => {",
                    `        res.json({ name: '${ctx.name}', status: 'ok' });`,
                    '    });',
                    '',
                    "    app.get('/health', (_req, res) => {",
                    "        res.json({ status: 'ok' });",
                    '    });',
                    '',
                    '    return app;',
                    '}',
                    '',
                ].join('\n')
            ),
            file(
                'src/index.ts',
                [
                    "import { createApp } from './app.js';",
                    '',
                    'const port = Number(process.env.PORT ?? 3000);',
                    "const host = process.env.HOST ?? '127.0.0.1';",
                    '',
                    'createApp().listen(port, host, () => {',
                    '    console.log(`Listening on http://${host}:${port}`);',
                    '});',
                    '',
                ].join('\n')
            ),
            file(
                'tests/app.test.ts',
                [
                    "import type { AddressInfo } from 'node:net';",
                    "import type { Server } from 'node:http';",
                    '',
                    "import { afterEach, describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import { createApp } from '../src/app.js';",
                    '',
                    'const servers: Server[] = [];',
                    '',
                    'afterEach(() => {',
                    '    for (const server of servers.splice(0)) server.close();',
                    '});',
                    '',
                    "describe('app', () => {",
                    "    it('serves the health endpoint', async () => {",
                    "        const server = createApp().listen(0, '127.0.0.1');",
                    '        servers.push(server);',
                    "        await new Promise(resolve => server.once('listening', resolve));",
                    '        const port = (server.address() as AddressInfo).port;',
                    '',
                    '        const response = await fetch(`http://127.0.0.1:${port}/health`);',
                    '',
                    '        expect(response.status).toBe(200);',
                    "        expect(await response.json()).toEqual({ status: 'ok' });",
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

function fastify(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        dependencies: { fastify: VERSIONS.fastify },
        devDependencies: { tsx: VERSIONS.tsx },
        scripts: TSX,
        tasks: TSX,
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(ctx.name, 'A Fastify 5 API server written in TypeScript.', [
                    '`GET /` and `GET /health` are included as a starting point.',
                ])
            ),
            file(
                'src/app.ts',
                [
                    "import Fastify, { type FastifyInstance } from 'fastify';",
                    '',
                    'export function buildApp(): FastifyInstance {',
                    '    const app = Fastify({ logger: true });',
                    '',
                    `    app.get('/', async () => ({ name: '${ctx.name}', status: 'ok' }));`,
                    "    app.get('/health', async () => ({ status: 'ok' }));",
                    '',
                    '    return app;',
                    '}',
                    '',
                ].join('\n')
            ),
            file(
                'src/index.ts',
                [
                    "import { buildApp } from './app.js';",
                    '',
                    'const app = buildApp();',
                    'const port = Number(process.env.PORT ?? 3000);',
                    "const host = process.env.HOST ?? '127.0.0.1';",
                    '',
                    'await app.listen({ port, host });',
                    '',
                ].join('\n')
            ),
            file(
                'tests/app.test.ts',
                [
                    "import { describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import { buildApp } from '../src/app.js';",
                    '',
                    "describe('app', () => {",
                    "    it('serves the health endpoint', async () => {",
                    '        const app = buildApp();',
                    '        try {',
                    "            const response = await app.inject({ method: 'GET', url: '/health' });",
                    '',
                    '            expect(response.statusCode).toBe(200);',
                    "            expect(response.json()).toEqual({ status: 'ok' });",
                    '        } finally {',
                    '            await app.close();',
                    '        }',
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

function bun(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        devDependencies: { '@types/bun': VERSIONS['@types/bun'] },
        scripts: BUN,
        tasks: BUN,
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            bunTsconfig(ctx),
            file(
                'README.md',
                readme(ctx.name, 'A Bun HTTP server using the built-in `Bun.serve` runtime.', [
                    'The scripts use the `bun` binary. Install Bun from <https://bun.sh>;',
                    'the package manager can still be Yarn, pnpm or npm.',
                ])
            ),
            file(
                'src/app.ts',
                [
                    'export interface AppOptions {',
                    '    name?: string;',
                    '}',
                    '',
                    'export function createApp(options: AppOptions = {}): {',
                    '    fetch(request: Request): Response;',
                    '} {',
                    `    const name = options.name ?? '${ctx.name}';`,
                    '',
                    '    return {',
                    '        fetch(request: Request): Response {',
                    '            const url = new URL(request.url);',
                    '',
                    "            if (url.pathname === '/' || url.pathname === '/health') {",
                    "                return Response.json({ name, status: 'ok' });",
                    '            }',
                    '',
                    "            return Response.json({ error: 'Not found' }, { status: 404 });",
                    '        },',
                    '    };',
                    '}',
                    '',
                ].join('\n')
            ),
            file(
                'src/index.ts',
                [
                    "import { createApp } from './app.js';",
                    '',
                    'const app = createApp();',
                    'const port = Number(Bun.env.PORT ?? 3000);',
                    "const hostname = Bun.env.HOST ?? '127.0.0.1';",
                    '',
                    'Bun.serve({ ...app, port, hostname });',
                    '',
                    'console.log(`Listening on http://${hostname}:${port}`);',
                    '',
                ].join('\n')
            ),
            file(
                'tests/app.test.ts',
                [
                    "import { describe, expect, it } from 'bun:test';",
                    '',
                    "import { createApp } from '../src/app.js';",
                    '',
                    "describe('app', () => {",
                    "    it('serves the health endpoint', async () => {",
                    '        const response = await createApp().fetch(',
                    "            new Request('http://localhost/health')",
                    '        );',
                    '',
                    '        expect(response.status).toBe(200);',
                    "        expect(await response.json()).toEqual({ status: 'ok' });",
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

function orpc(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        dependencies: { '@orpc/server': VERSIONS['@orpc/server'], zod: VERSIONS.zod },
        devDependencies: { tsx: VERSIONS.tsx },
        scripts: TSX,
        tasks: TSX,
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(ctx.name, 'A type-safe oRPC API served over Node HTTP.', [
                    'Procedures live in `src/router.ts`; the client can import the router',
                    'type directly for end-to-end type safety.',
                ])
            ),
            file(
                'src/planets.ts',
                [
                    'export interface Planet {',
                    '    id: number;',
                    '    name: string;',
                    '}',
                    '',
                    'export const planets: Planet[] = [',
                    "    { id: 1, name: 'Earth' },",
                    "    { id: 2, name: 'Mars' },",
                    '];',
                    '',
                    'export function findPlanet(id: number): Planet | undefined {',
                    '    return planets.find(planet => planet.id === id);',
                    '}',
                    '',
                ].join('\n')
            ),
            file(
                'src/router.ts',
                [
                    "import { os } from '@orpc/server';",
                    "import * as z from 'zod';",
                    '',
                    "import { findPlanet, planets } from './planets.js';",
                    '',
                    'export const listPlanets = os.handler(async () => planets);',
                    '',
                    'export const getPlanet = os',
                    '    .input(z.object({ id: z.number().int().positive() }))',
                    '    .handler(async ({ input }) => {',
                    '        const planet = findPlanet(input.id);',
                    "        if (!planet) throw new Error('Planet not found');",
                    '        return planet;',
                    '    });',
                    '',
                    'export const router = {',
                    '    planet: {',
                    '        list: listPlanets,',
                    '        get: getPlanet,',
                    '    },',
                    '};',
                    '',
                ].join('\n')
            ),
            file(
                'src/index.ts',
                [
                    "import { createServer } from 'node:http';",
                    '',
                    "import { RPCHandler } from '@orpc/server/node';",
                    '',
                    "import { router } from './router.js';",
                    '',
                    'const handler = new RPCHandler(router);',
                    '',
                    'const server = createServer(async (request, response) => {',
                    "    const { matched } = await handler.handle(request, response, { prefix: '/rpc' });",
                    '    if (matched) return;',
                    '',
                    '    response.statusCode = 404;',
                    "    response.end('Not found');",
                    '});',
                    '',
                    'const port = Number(process.env.PORT ?? 3000);',
                    "const host = process.env.HOST ?? '127.0.0.1';",
                    '',
                    'server.listen(port, host, () => {',
                    `    console.log(\`oRPC listening on http://\${host}:\${port}/rpc\`);`,
                    '});',
                    '',
                ].join('\n')
            ),
            file(
                'tests/planets.test.ts',
                [
                    "import { describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import { findPlanet, planets } from '../src/planets.js';",
                    '',
                    "describe('planets', () => {",
                    "    it('finds a planet by id', () => {",
                    '        expect(findPlanet(1)).toEqual({ id: 1, name: "Earth" });',
                    '        expect(findPlanet(99)).toBeUndefined();',
                    '        expect(planets.length).toBeGreaterThan(0);',
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

/** Shared content-type helper generated into the file-server templates. */
const CONTENT_TYPES = [
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

function localFileServer(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        devDependencies: { tsx: VERSIONS.tsx },
        scripts: TSX,
        tasks: TSX,
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(ctx.name, 'A dependency-free file server that serves a local directory.', [
                    'Set `FILE_ROOT` to the directory to serve (default `public`) and',
                    '`PORT`/`HOST` to change the listener. The server refuses `..` traversal.',
                ])
            ),
            file(
                'src/server.ts',
                [
                    "import { createReadStream } from 'node:fs';",
                    "import { stat } from 'node:fs/promises';",
                    "import { createServer, type Server, type ServerResponse } from 'node:http';",
                    "import path from 'node:path';",
                    '',
                    CONTENT_TYPES,
                    '',
                    'export function resolveFile(root: string, urlPath: string): string | undefined {',
                    '    const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");',
                    '    const relative = decoded.replace(/^\\/+/, "");',
                    '    if (relative.split("/").includes("..")) return undefined;',
                    '',
                    '    const base = path.resolve(root);',
                    '    const resolved = path.resolve(base, relative);',
                    '    return resolved === base || resolved.startsWith(`${base}${path.sep}`)',
                    '        ? resolved',
                    '        : undefined;',
                    '}',
                    '',
                    'async function sendFile(',
                    '    response: ServerResponse,',
                    '    file: string,',
                    '    method: string | undefined',
                    '): Promise<void> {',
                    '    try {',
                    '        const info = await stat(file);',
                    '        response.writeHead(200, {',
                    '            "content-length": String(info.size),',
                    '            "content-type": contentType(file),',
                    '        });',
                    '        if (method === "HEAD") {',
                    '            response.end();',
                    '            return;',
                    '        }',
                    '        createReadStream(file).pipe(response);',
                    '    } catch {',
                    '        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });',
                    '        response.end("Not found");',
                    '    }',
                    '}',
                    '',
                    'export function createFileServer(root: string): Server {',
                    '    return createServer((request, response) => {',
                    '        if (request.method !== "GET" && request.method !== "HEAD") {',
                    '            response.writeHead(405, { allow: "GET, HEAD" });',
                    '            response.end();',
                    '            return;',
                    '        }',
                    '',
                    '        const resolved = resolveFile(root, request.url ?? "/");',
                    '        if (!resolved) {',
                    '            response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });',
                    '            response.end("Bad path");',
                    '            return;',
                    '        }',
                    '',
                    '        void sendFile(response, resolved, request.method);',
                    '    });',
                    '}',
                    '',
                ].join('\n')
            ),
            file(
                'src/index.ts',
                [
                    "import path from 'node:path';",
                    '',
                    "import { createFileServer } from './server.js';",
                    '',
                    'const root = path.resolve(process.env.FILE_ROOT ?? "public");',
                    'const port = Number(process.env.PORT ?? 3000);',
                    "const host = process.env.HOST ?? '127.0.0.1';",
                    '',
                    'createFileServer(root).listen(port, host, () => {',
                    '    console.log(`Serving ${root} on http://${host}:${port}`);',
                    '});',
                    '',
                ].join('\n')
            ),
            file(
                'public/index.html',
                [
                    '<!doctype html>',
                    '<html lang="en">',
                    '    <head>',
                    '        <meta charset="UTF-8" />',
                    '        <title>Files</title>',
                    '    </head>',
                    '    <body>',
                    '        <p>Add files to <code>public/</code> to serve them.</p>',
                    '    </body>',
                    '</html>',
                    '',
                ].join('\n')
            ),
            file(
                'tests/server.test.ts',
                [
                    "import fs from 'node:fs';",
                    "import os from 'node:os';",
                    "import path from 'node:path';",
                    "import type { AddressInfo } from 'node:net';",
                    '',
                    "import { afterEach, describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import { createFileServer } from '../src/server.js';",
                    '',
                    'const dirs: string[] = [];',
                    '',
                    'afterEach(() => {',
                    '    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });',
                    '});',
                    '',
                    "describe('file server', () => {",
                    "    it('serves a file and rejects traversal', async () => {",
                    "        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'file-server-'));",
                    '        dirs.push(root);',
                    "        fs.writeFileSync(path.join(root, 'hello.txt'), 'hello');",
                    '',
                    '        const server = createFileServer(root);',
                    '        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));',
                    '        const port = (server.address() as AddressInfo).port;',
                    '',
                    '        try {',
                    '            const ok = await fetch(`http://127.0.0.1:${port}/hello.txt`);',
                    '            expect(ok.status).toBe(200);',
                    '            expect(await ok.text()).toBe("hello");',
                    '',
                    '            const bad = await fetch(`http://127.0.0.1:${port}/..%2Fsecret.txt`);',
                    '            expect([400, 404]).toContain(bad.status);',
                    '        } finally {',
                    '            server.close();',
                    '        }',
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

/** Render the S3-backed server; `minio` uses explicit credentials/endpoint. */
function renderS3Server(minio: boolean): string {
    const clientConfig = minio
        ? [
              '        region: process.env.S3_REGION ?? "us-east-1",',
              '        endpoint: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",',
              '        forcePathStyle: true,',
              '        credentials: {',
              '            accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "minioadmin",',
              '            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "minioadmin",',
              '        },',
          ]
        : [
              '        region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "us-east-1",',
              '        ...(process.env.S3_ENDPOINT',
              '            ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }',
              '            : {}),',
          ];
    return [
        "import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';",
        "import { createServer, type Server } from 'node:http';",
        '',
        CONTENT_TYPES,
        '',
        'export interface S3FileServerOptions {',
        '    bucket: string;',
        '}',
        '',
        'export function objectKey(urlPath: string): string | undefined {',
        '    const key = decodeURIComponent(urlPath.split("?")[0] ?? "/")',
        '        .replace(/^\\/+/, "")',
        '        .replace(/^files\\/?/, "");',
        '    if (!key || key.split("/").includes("..")) return undefined;',
        '    return key;',
        '}',
        '',
        'export function createS3FileServer(options: S3FileServerOptions): Server {',
        '    const client = new S3Client({',
        ...clientConfig,
        '    });',
        '',
        '    return createServer(async (request, response) => {',
        '        try {',
        '            const key = objectKey(request.url ?? "/");',
        '',
        '            if (request.method === "GET" && (key === "" || key === undefined)) {',
        '                const list = await client.send(',
        '                    new ListObjectsV2Command({ Bucket: options.bucket })',
        '                );',
        '                response.writeHead(200, { "content-type": "application/json" });',
        '                response.end(JSON.stringify(list.Contents ?? []));',
        '                return;',
        '            }',
        '',
        '            if (request.method === "GET" && key) {',
        '                const object = await client.send(',
        '                    new GetObjectCommand({ Bucket: options.bucket, Key: key })',
        '                );',
        '                response.writeHead(200, {',
        '                    "content-type": object.ContentType ?? contentType(key),',
        '                    ...(object.ContentLength',
        '                        ? { "content-length": String(object.ContentLength) }',
        '                        : {}),',
        '                });',
        '                object.Body?.transformToWebStream().pipeTo(',
        '                    new WritableStream({',
        '                        write(chunk) {',
        '                            response.write(chunk as Uint8Array);',
        '                        },',
        '                        close() {',
        '                            response.end();',
        '                        },',
        '                    })',
        '                );',
        '                return;',
        '            }',
        '',
        '            if (request.method === "PUT" && key) {',
        '                const chunks: Buffer[] = [];',
        '                for await (const chunk of request) chunks.push(Buffer.from(chunk));',
        '                await client.send(',
        '                    new PutObjectCommand({',
        '                        Bucket: options.bucket,',
        '                        Key: key,',
        '                        Body: Buffer.concat(chunks),',
        '                        ContentType: contentType(key),',
        '                    })',
        '                );',
        '                response.writeHead(201).end();',
        '                return;',
        '            }',
        '',
        '            response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });',
        '            response.end("Not found");',
        '        } catch (error) {',
        '            console.error(error);',
        '            response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });',
        '            response.end("Internal error");',
        '        }',
        '    });',
        '}',
        '',
    ].join('\n');
}

function s3FileServer(ctx: ProjectContext, minio: boolean): GeneratedFile[] {
    const title = minio ? 'A MinIO / S3 file server' : 'An AWS S3 file server';
    const env = minio
        ? [
              '`S3_BUCKET` (required), `S3_ENDPOINT` (default `http://127.0.0.1:9000`),',
              '`S3_REGION`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`',
              '(defaults `minioadmin` for local development).',
          ]
        : [
              '`S3_BUCKET` (required) and `S3_REGION`; credentials come from the',
              'standard AWS provider chain. Set `S3_ENDPOINT` for an S3-compatible',
              'service.',
          ];
    const minioExtra = minio
        ? [
              '',
              '## Local MinIO',
              '',
              '```sh',
              'docker run --rm -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"',
              '```',
          ]
        : [];
    return recipe(ctx, {
        dependencies: { '@aws-sdk/client-s3': VERSIONS['@aws-sdk/client-s3'] },
        devDependencies: { tsx: VERSIONS.tsx },
        scripts: TSX,
        tasks: TSX,
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(ctx.name, `${title} with list, download and upload endpoints.`, [
                    `Environment: ${env.join(' ')}`,
                    '',
                    'Endpoints: `GET /files` (list), `GET /files/<key>` (download),',
                    '`PUT /files/<key>` (upload).',
                    ...minioExtra,
                ])
            ),
            file(
                '.env.example',
                `S3_BUCKET=my-bucket\nS3_REGION=us-east-1\n${minio ? 'S3_ENDPOINT=http://127.0.0.1:9000\nS3_ACCESS_KEY_ID=minioadmin\nS3_SECRET_ACCESS_KEY=minioadmin\n' : ''}`
            ),
            file('src/server.ts', renderS3Server(minio)),
            file(
                'src/index.ts',
                [
                    "import { createS3FileServer } from './server.js';",
                    '',
                    'const bucket = process.env.S3_BUCKET;',
                    'if (!bucket) {',
                    '    console.error("S3_BUCKET is required.");',
                    '    process.exit(1);',
                    '}',
                    '',
                    'const port = Number(process.env.PORT ?? 3000);',
                    "const host = process.env.HOST ?? '127.0.0.1';",
                    '',
                    'createS3FileServer({ bucket }).listen(port, host, () => {',
                    '    console.log(`Serving s3://${bucket} on http://${host}:${port}`);',
                    '});',
                    '',
                ].join('\n')
            ),
            file(
                'tests/server.test.ts',
                [
                    "import { describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import { contentType, objectKey } from '../src/server.js';",
                    '',
                    "describe('s3 file server', () => {",
                    "    it('parses object keys safely', () => {",
                    '        expect(objectKey("/files/hello.txt")).toBe("hello.txt");',
                    '        expect(objectKey("/files/a/b.json")).toBe("a/b.json");',
                    '        expect(objectKey("/files/../secret")).toBeUndefined();',
                    '        expect(objectKey("/")).toBeUndefined();',
                    '    });',
                    '',
                    "    it('maps content types', () => {",
                    '        expect(contentType("a.json")).toContain("application/json");',
                    '        expect(contentType("a.unknown")).toBe("application/octet-stream");',
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

function bunS3FileServer(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        devDependencies: { '@types/bun': VERSIONS['@types/bun'] },
        scripts: BUN,
        tasks: BUN,
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            bunTsconfig(ctx),
            file(
                'README.md',
                readme(
                    ctx.name,
                    'A Bun file server backed by S3 (AWS, MinIO, Cloudflare R2, ...).',
                    [
                        'Environment: `S3_BUCKET` (required), `S3_REGION`, `S3_ENDPOINT`,',
                        '`S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`.',
                        '',
                        'Endpoints: `GET /files` (list), `GET /files/<key>` (download),',
                        '`PUT /files/<key>` (upload).',
                    ]
                )
            ),
            file(
                '.env.example',
                'S3_BUCKET=my-bucket\nS3_REGION=us-east-1\nS3_ENDPOINT=http://127.0.0.1:9000\nS3_ACCESS_KEY_ID=minioadmin\nS3_SECRET_ACCESS_KEY=minioadmin\n'
            ),
            file(
                'src/app.ts',
                [
                    'export interface AppOptions {',
                    '    bucket: string;',
                    '}',
                    '',
                    'export function objectKey(urlPath: string): string | undefined {',
                    '    const key = decodeURIComponent(urlPath.split("?")[0] ?? "/")',
                    '        .replace(/^\\/+/, "")',
                    '        .replace(/^files\\/?/, "");',
                    '    if (!key || key.split("/").includes("..")) return undefined;',
                    '    return key;',
                    '}',
                    '',
                    'export function createApp(options: AppOptions) {',
                    '    const client = new Bun.S3Client({',
                    '        bucket: options.bucket,',
                    '        region: Bun.env.S3_REGION ?? "us-east-1",',
                    '        ...(Bun.env.S3_ENDPOINT ? { endpoint: Bun.env.S3_ENDPOINT } : {}),',
                    '        ...(Bun.env.S3_ACCESS_KEY_ID ? { accessKeyId: Bun.env.S3_ACCESS_KEY_ID } : {}),',
                    '        ...(Bun.env.S3_SECRET_ACCESS_KEY',
                    '            ? { secretAccessKey: Bun.env.S3_SECRET_ACCESS_KEY }',
                    '            : {}),',
                    '    });',
                    '',
                    '    return {',
                    '        async fetch(request: Request): Promise<Response> {',
                    '            const key = objectKey(new URL(request.url).pathname);',
                    '',
                    '            if (request.method === "GET" && !key) {',
                    '                const result = await client.list({});',
                    '                const files = (result.contents ?? [])',
                    '                    .map(item => item.key)',
                    '                    .filter(Boolean);',
                    '                return Response.json(files);',
                    '            }',
                    '',
                    '            if (request.method === "GET" && key) {',
                    '                const file = client.file(key);',
                    '                if (!(await file.exists())) {',
                    '                    return Response.json({ error: "Not found" }, { status: 404 });',
                    '                }',
                    '                return new Response(file.stream(), {',
                    '                    headers: { "content-type": file.type || "application/octet-stream" },',
                    '                });',
                    '            }',
                    '',
                    '            if (request.method === "PUT" && key) {',
                    '                await client.write(key, await request.arrayBuffer());',
                    '                return new Response(null, { status: 201 });',
                    '            }',
                    '',
                    '            return Response.json({ error: "Not found" }, { status: 404 });',
                    '        },',
                    '    };',
                    '}',
                    '',
                ].join('\n')
            ),
            file(
                'src/index.ts',
                [
                    "import { createApp } from './app.js';",
                    '',
                    'const bucket = Bun.env.S3_BUCKET;',
                    'if (!bucket) {',
                    '    console.error("S3_BUCKET is required.");',
                    '    process.exit(1);',
                    '}',
                    '',
                    'const port = Number(Bun.env.PORT ?? 3000);',
                    "const hostname = Bun.env.HOST ?? '127.0.0.1';",
                    '',
                    'Bun.serve({ ...createApp({ bucket }), port, hostname });',
                    '',
                    'console.log(`Serving s3://${bucket} on http://${hostname}:${port}`);',
                    '',
                ].join('\n')
            ),
            file(
                'tests/app.test.ts',
                [
                    "import { describe, expect, it } from 'bun:test';",
                    '',
                    "import { objectKey } from '../src/app.js';",
                    '',
                    "describe('objectKey', () => {",
                    "    it('strips the files prefix and rejects traversal', () => {",
                    '        expect(objectKey("/files/a/b.txt")).toBe("a/b.txt");',
                    '        expect(objectKey("/files/../secret")).toBeUndefined();',
                    '        expect(objectKey("/")).toBeUndefined();',
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

function rcloneFileServer(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        devDependencies: { tsx: VERSIONS.tsx },
        scripts: TSX,
        tasks: TSX,
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(ctx.name, 'A file server that exposes an rclone remote over HTTP.', [
                    'Requires the `rclone` binary on `PATH` and a configured remote.',
                    'Set `RCLONE_REMOTE` (for example `s3:my-bucket` or `gdrive:docs`)',
                    'and optionally `PORT`/`HOST`.',
                    '',
                    'Endpoints: `GET /files` (list), `GET /files/<key>` (download),',
                    '`PUT /files/<key>` (upload).',
                ])
            ),
            file(
                'src/server.ts',
                [
                    'import { execFile, spawn } from "node:child_process";',
                    'import { mkdtemp, rm, writeFile } from "node:fs/promises";',
                    'import { createServer, type Server } from "node:http";',
                    'import os from "node:os";',
                    'import path from "node:path";',
                    'import { promisify } from "node:util";',
                    '',
                    'const run = promisify(execFile);',
                    '',
                    'export function remotePath(remote: string, key: string): string {',
                    '    return `${remote.replace(/\\/+$/, "")}/${key.replace(/^\\/+/, "")}`;',
                    '}',
                    '',
                    'export function objectKey(urlPath: string): string | undefined {',
                    '    const key = decodeURIComponent(urlPath.split("?")[0] ?? "/")',
                    '        .replace(/^\\/+/, "")',
                    '        .replace(/^files\\/?/, "");',
                    '    if (!key || key.split("/").includes("..")) return undefined;',
                    '    return key;',
                    '}',
                    '',
                    'export function createRcloneServer(remote: string): Server {',
                    '    return createServer(async (request, response) => {',
                    '        const key = objectKey(request.url ?? "/");',
                    '',
                    '        try {',
                    '            if (request.method === "GET" && !key) {',
                    '                const { stdout } = await run("rclone", [',
                    '                    "lsjson",',
                    '                    remote,',
                    '                    "--recursive",',
                    '                    "--files-only",',
                    '                ]);',
                    '                response.writeHead(200, { "content-type": "application/json" });',
                    '                response.end(stdout);',
                    '                return;',
                    '            }',
                    '',
                    '            if (request.method === "GET" && key) {',
                    '                const child = spawn("rclone", ["cat", remotePath(remote, key)]);',
                    '                child.on("error", () => {',
                    '                    if (!response.headersSent) response.writeHead(500).end();',
                    '                });',
                    '                child.stderr.on("data", () => {',
                    '                    if (!response.headersSent) response.writeHead(404);',
                    '                });',
                    '                child.stdout.pipe(response);',
                    '                return;',
                    '            }',
                    '',
                    '            if (request.method === "PUT" && key) {',
                    '                const chunks: Buffer[] = [];',
                    '                for await (const chunk of request) chunks.push(Buffer.from(chunk));',
                    '                const dir = await mkdtemp(path.join(os.tmpdir(), "rclone-upload-"));',
                    '                const temp = path.join(dir, "upload");',
                    '                try {',
                    '                    await writeFile(temp, Buffer.concat(chunks));',
                    '                    await run("rclone", ["copyto", temp, remotePath(remote, key)]);',
                    '                } finally {',
                    '                    await rm(dir, { recursive: true, force: true });',
                    '                }',
                    '                response.writeHead(201).end();',
                    '                return;',
                    '            }',
                    '',
                    '            response.writeHead(404).end("Not found");',
                    '        } catch (error) {',
                    '            console.error(error);',
                    '            if (!response.headersSent) {',
                    '                response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });',
                    '                response.end("Internal error");',
                    '            }',
                    '        }',
                    '    });',
                    '}',
                    '',
                ].join('\n')
            ),
            file(
                'src/index.ts',
                [
                    "import { createRcloneServer } from './server.js';",
                    '',
                    'const remote = process.env.RCLONE_REMOTE;',
                    'if (!remote) {',
                    '    console.error("RCLONE_REMOTE is required (for example s3:my-bucket).");',
                    '    process.exit(1);',
                    '}',
                    '',
                    'const port = Number(process.env.PORT ?? 3000);',
                    "const host = process.env.HOST ?? '127.0.0.1';",
                    '',
                    'createRcloneServer(remote).listen(port, host, () => {',
                    '    console.log(`Serving ${remote} on http://${host}:${port}`);',
                    '});',
                    '',
                ].join('\n')
            ),
            file(
                'tests/server.test.ts',
                [
                    "import { describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import { objectKey, remotePath } from '../src/server.js';",
                    '',
                    "describe('rclone file server', () => {",
                    "    it('builds remote paths without duplicate slashes', () => {",
                    '        expect(remotePath("s3:bucket/", "/a/b.txt")).toBe("s3:bucket/a/b.txt");',
                    '        expect(remotePath("gdrive:docs", "a/b.txt")).toBe("gdrive:docs/a/b.txt");',
                    '    });',
                    '',
                    "    it('parses and validates keys', () => {",
                    '        expect(objectKey("/files/a.txt")).toBe("a.txt");',
                    '        expect(objectKey("/files/../secret")).toBeUndefined();',
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

function ollamaChat(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        application: true,
        scripts: {
            dev: 'vp dev',
            build: 'vp build',
            preview: 'vp preview',
            test: 'vp test',
        },
        tasks: { dev: 'vp dev', build: 'vp build', preview: 'vp preview', test: 'vp test' },
        remove: ['src/index.ts', 'tests/index.test.ts'],
        files: [
            file(
                'README.md',
                readme(ctx.name, 'A local chat UI for Ollama with streaming responses.', [
                    'Start Ollama, then run `yarn dev`. The UI reads the default server',
                    '`http://127.0.0.1:11434`; change it in the header and it is saved in',
                    '`localStorage`.',
                    '',
                    'If the browser blocks the request, allow the dev origin (for example',
                    '`OLLAMA_ORIGINS=http://localhost:5173 ollama serve`).',
                ])
            ),
            file(
                'index.html',
                [
                    '<!doctype html>',
                    '<html lang="en">',
                    '    <head>',
                    '        <meta charset="UTF-8" />',
                    '        <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
                    `        <title>${ctx.name}</title>`,
                    '    </head>',
                    '    <body>',
                    '        <div id="app"></div>',
                    '        <script type="module" src="/src/main.ts"></script>',
                    '    </body>',
                    '</html>',
                    '',
                ].join('\n')
            ),
            file(
                'src/ollama.ts',
                [
                    'export interface ChatMessage {',
                    "    role: 'system' | 'user' | 'assistant';",
                    '    content: string;',
                    '}',
                    '',
                    'export interface ChatChunk {',
                    '    message?: { content?: string };',
                    '    done?: boolean;',
                    '}',
                    '',
                    "export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';",
                    '',
                    'export function ollamaUrl(pathname: string, base = DEFAULT_OLLAMA_URL): string {',
                    '    return `${base.replace(/\\/+$/, "")}${pathname}`;',
                    '}',
                    '',
                    'export function parseStreamLine(line: string): ChatChunk | undefined {',
                    '    const trimmed = line.trim();',
                    '    if (!trimmed) return undefined;',
                    '    try {',
                    '        return JSON.parse(trimmed) as ChatChunk;',
                    '    } catch {',
                    '        return undefined;',
                    '    }',
                    '}',
                    '',
                    'export async function listModels(base?: string): Promise<string[]> {',
                    '    const response = await fetch(ollamaUrl("/api/tags", base));',
                    '    if (!response.ok) throw new Error(`Ollama responded ${response.status}`);',
                    '    const data = (await response.json()) as { models?: { name: string }[] };',
                    '    return (data.models ?? []).map(model => model.name);',
                    '}',
                    '',
                    'export async function* streamChat(',
                    '    model: string,',
                    '    messages: ChatMessage[],',
                    '    options: { base?: string; signal?: AbortSignal } = {}',
                    '): AsyncGenerator<string> {',
                    '    const response = await fetch(ollamaUrl("/api/chat", options.base), {',
                    '        method: "POST",',
                    '        headers: { "content-type": "application/json" },',
                    '        body: JSON.stringify({ model, messages, stream: true }),',
                    '        ...(options.signal ? { signal: options.signal } : {}),',
                    '    });',
                    '    if (!response.ok || !response.body) {',
                    '        throw new Error(`Ollama responded ${response.status}`);',
                    '    }',
                    '',
                    '    const reader = response.body.getReader();',
                    '    const decoder = new TextDecoder();',
                    '    let buffer = "";',
                    '',
                    '    for (;;) {',
                    '        const { done, value } = await reader.read();',
                    '        if (done) break;',
                    '        buffer += decoder.decode(value, { stream: true });',
                    '        const lines = buffer.split("\\n");',
                    '        buffer = lines.pop() ?? "";',
                    '        for (const line of lines) {',
                    '            const content = parseStreamLine(line)?.message?.content;',
                    '            if (content) yield content;',
                    '        }',
                    '    }',
                    '',
                    '    const content = parseStreamLine(buffer)?.message?.content;',
                    '    if (content) yield content;',
                    '}',
                    '',
                ].join('\n')
            ),
            file(
                'src/main.ts',
                [
                    "import './style.css';",
                    '',
                    'import {',
                    '    DEFAULT_OLLAMA_URL,',
                    '    listModels,',
                    '    streamChat,',
                    '    type ChatMessage,',
                    "} from './ollama.js';",
                    '',
                    'const STORAGE_KEY = "ollama-url";',
                    'const messages: ChatMessage[] = [];',
                    'let controller: AbortController | undefined;',
                    '',
                    'const root = document.querySelector<HTMLDivElement>("#app");',
                    'if (!root) throw new Error("Missing #app");',
                    '',
                    'root.innerHTML = `',
                    '    <main class="app">',
                    '        <header class="bar">',
                    '            <h1>Ollama chat</h1>',
                    '            <label class="server">',
                    '                Server',
                    '                <input id="base" type="url" spellcheck="false" />',
                    '            </label>',
                    '            <select id="model" aria-label="Model"></select>',
                    '            <button id="refresh" type="button" class="ghost">Refresh</button>',
                    '            <button id="clear" type="button" class="ghost">Clear</button>',
                    '        </header>',
                    '        <section id="messages" class="messages" aria-live="polite"></section>',
                    '        <form id="composer" class="composer">',
                    '            <textarea id="prompt" rows="2" placeholder="Ask something…"></textarea>',
                    '            <button id="send" type="submit">Send</button>',
                    '        </form>',
                    '        <p id="status" class="status"></p>',
                    '    </main>',
                    '`;',
                    '',
                    'const $ = <T extends HTMLElement>(selector: string): T => {',
                    '    const element = root.querySelector<T>(selector);',
                    '    if (!element) throw new Error(`Missing ${selector}`);',
                    '    return element;',
                    '};',
                    '',
                    'const baseInput = $<HTMLInputElement>("#base");',
                    'const modelSelect = $<HTMLSelectElement>("#model");',
                    'const messagesEl = $<HTMLDivElement>("#messages");',
                    'const promptEl = $<HTMLTextAreaElement>("#prompt");',
                    'const statusEl = $<HTMLParagraphElement>("#status");',
                    'const sendButton = $<HTMLButtonElement>("#send");',
                    '',
                    'baseInput.value = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_OLLAMA_URL;',
                    'baseInput.addEventListener("change", () => {',
                    '    localStorage.setItem(STORAGE_KEY, baseInput.value.trim());',
                    '    void refreshModels();',
                    '});',
                    '',
                    'function append(role: ChatMessage["role"]): HTMLDivElement {',
                    '    const bubble = document.createElement("div");',
                    '    bubble.className = `message ${role}`;',
                    '    const body = document.createElement("div");',
                    '    body.className = "content";',
                    '    bubble.append(body);',
                    '    messagesEl.append(bubble);',
                    '    bubble.scrollIntoView({ block: "end" });',
                    '    return body;',
                    '}',
                    '',
                    'async function refreshModels(): Promise<void> {',
                    '    try {',
                    '        const models = await listModels(baseInput.value.trim());',
                    '        modelSelect.replaceChildren(',
                    '            ...models.map(name => {',
                    '                const option = document.createElement("option");',
                    '                option.value = name;',
                    '                option.textContent = name;',
                    '                return option;',
                    '            })',
                    '        );',
                    '        statusEl.textContent = models.length ? "" : "No models installed. Run `ollama pull llama3.2`.";',
                    '    } catch (error) {',
                    '        statusEl.textContent = error instanceof Error ? error.message : String(error);',
                    '    }',
                    '}',
                    '',
                    '$<HTMLButtonElement>("#refresh").addEventListener("click", () => void refreshModels());',
                    '$<HTMLButtonElement>("#clear").addEventListener("click", () => {',
                    '    messages.length = 0;',
                    '    messagesEl.replaceChildren();',
                    '});',
                    '',
                    'async function send(prompt: string): Promise<void> {',
                    '    const model = modelSelect.value;',
                    '    if (!model) {',
                    '        statusEl.textContent = "Select or install a model first.";',
                    '        return;',
                    '    }',
                    '',
                    '    messages.push({ role: "user", content: prompt });',
                    '    append("user").textContent = prompt;',
                    '    const output = append("assistant");',
                    '    controller = new AbortController();',
                    '    sendButton.disabled = true;',
                    '    statusEl.textContent = "Thinking…";',
                    '',
                    '    let answer = "";',
                    '    try {',
                    '        for await (const delta of streamChat(model, messages, {',
                    '            base: baseInput.value.trim(),',
                    '            signal: controller.signal,',
                    '        })) {',
                    '            answer += delta;',
                    '            output.textContent = answer;',
                    '            output.scrollIntoView({ block: "end" });',
                    '        }',
                    '        messages.push({ role: "assistant", content: answer });',
                    '        statusEl.textContent = "";',
                    '    } catch (error) {',
                    '        if ((error as Error).name === "AbortError") statusEl.textContent = "Stopped.";',
                    '        else statusEl.textContent = error instanceof Error ? error.message : String(error);',
                    '    } finally {',
                    '        sendButton.disabled = false;',
                    '        controller = undefined;',
                    '    }',
                    '}',
                    '',
                    '$<HTMLFormElement>("#composer").addEventListener("submit", event => {',
                    '    event.preventDefault();',
                    '    const prompt = promptEl.value.trim();',
                    '    if (!prompt) return;',
                    '    promptEl.value = "";',
                    '    void send(prompt);',
                    '});',
                    '',
                    'promptEl.addEventListener("keydown", event => {',
                    '    if (event.key === "Enter" && !event.shiftKey) {',
                    '        event.preventDefault();',
                    '        $<HTMLFormElement>("#composer").requestSubmit();',
                    '    }',
                    '});',
                    '',
                    'void refreshModels();',
                    '',
                ].join('\n')
            ),
            file(
                'src/style.css',
                [
                    ':root {',
                    '    color-scheme: light dark;',
                    '    font-family: system-ui, -apple-system, Segoe UI, sans-serif;',
                    '}',
                    '',
                    'body {',
                    '    margin: 0;',
                    '    background: #0f1115;',
                    '    color: #e6e6e6;',
                    '}',
                    '',
                    '.app {',
                    '    display: grid;',
                    '    grid-template-rows: auto 1fr auto auto;',
                    '    height: 100vh;',
                    '    max-width: 900px;',
                    '    margin: 0 auto;',
                    '    padding: 16px;',
                    '    box-sizing: border-box;',
                    '}',
                    '',
                    '.bar {',
                    '    display: flex;',
                    '    gap: 8px;',
                    '    align-items: center;',
                    '    flex-wrap: wrap;',
                    '}',
                    '',
                    '.bar h1 { font-size: 1.1rem; margin: 0 8px 0 0; }',
                    '.server { display: flex; align-items: center; gap: 6px; color: #9aa0a6; }',
                    '',
                    'input, select, textarea, button {',
                    '    font: inherit;',
                    '    border-radius: 8px;',
                    '    border: 1px solid #2a2f3a;',
                    '    background: #171a21;',
                    '    color: inherit;',
                    '    padding: 8px;',
                    '}',
                    '',
                    'button { cursor: pointer; }',
                    '.ghost { background: transparent; }',
                    '',
                    '.messages {',
                    '    overflow-y: auto;',
                    '    display: flex;',
                    '    flex-direction: column;',
                    '    gap: 10px;',
                    '    padding: 16px 0;',
                    '}',
                    '',
                    '.message { display: flex; }',
                    '.message.user { justify-content: flex-end; }',
                    '',
                    '.content {',
                    '    max-width: 80%;',
                    '    padding: 10px 12px;',
                    '    border-radius: 12px;',
                    '    white-space: pre-wrap;',
                    '    line-height: 1.5;',
                    '}',
                    '',
                    '.user .content { background: #2563eb; }',
                    '.assistant .content { background: #1b1f27; }',
                    '',
                    '.composer { display: flex; gap: 8px; }',
                    '.composer textarea { flex: 1; resize: vertical; }',
                    '.status { min-height: 1.2em; color: #9aa0a6; margin: 6px 0 0; }',
                    '',
                ].join('\n')
            ),
            file(
                'tests/ollama.test.ts',
                [
                    "import { describe, expect, it } from 'vite-plus/test';",
                    '',
                    "import { ollamaUrl, parseStreamLine } from '../src/ollama.js';",
                    '',
                    "describe('ollama helpers', () => {",
                    "    it('parses stream lines and ignores partial JSON', () => {",
                    '        expect(parseStreamLine(\'{"message":{"content":"hi"},"done":false}\')).toEqual({',
                    '            message: { content: "hi" },',
                    '            done: false,',
                    '        });',
                    '        expect(parseStreamLine("{")).toBeUndefined();',
                    '        expect(parseStreamLine("  ")).toBeUndefined();',
                    '    });',
                    '',
                    "    it('normalizes the base URL', () => {",
                    '        expect(ollamaUrl("/api/tags", "http://host:11434/")).toBe(',
                    '            "http://host:11434/api/tags"',
                    '        );',
                    '    });',
                    '});',
                    '',
                ].join('\n')
            ),
        ],
    });
}

/** Build the files for a quality-of-life builtin template. */
export function createQolProjectFiles(id: QolTemplateId, ctx: ProjectContext): GeneratedFile[] {
    switch (id) {
        case 'vitepress':
            return vitePress(ctx);
        case 'express':
            return express(ctx);
        case 'bun':
            return bun(ctx);
        case 'fastify':
            return fastify(ctx);
        case 'orpc':
            return orpc(ctx);
        case 'file-server':
            return localFileServer(ctx);
        case 'file-server-s3':
            return s3FileServer(ctx, false);
        case 'file-server-minio':
            return s3FileServer(ctx, true);
        case 'file-server-bun-s3':
            return bunS3FileServer(ctx);
        case 'file-server-rclone':
            return rcloneFileServer(ctx);
        case 'ollama-chat':
            return ollamaChat(ctx);
    }
}
