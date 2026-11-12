import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../typescript.js';
import { file, readme, recipe, TSX, VERSIONS } from './shared.js';

export function fastify(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        dependencies: { fastify: VERSIONS.fastify },
        devDependencies: { tsx: VERSIONS.tsx },
        scripts: TSX,
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
