import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../typescript.js';
import { file, readme, recipe, TSX, VERSIONS } from './shared.js';

export function express(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        dependencies: { express: VERSIONS.express },
        devDependencies: { '@types/express': VERSIONS['@types/express'], tsx: VERSIONS.tsx },
        scripts: TSX,
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
