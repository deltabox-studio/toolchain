import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../types/index.js';
import { BUN, bunTsconfig, file, readme, recipe, VERSIONS } from './shared.js';

export function bun(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        devDependencies: { '@types/bun': VERSIONS['@types/bun'] },
        scripts: BUN,
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
