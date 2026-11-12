import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../typescript.js';
import { file, readme, recipe, TSX, VERSIONS } from './shared.js';

export function orpc(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        dependencies: { '@orpc/server': VERSIONS['@orpc/server'], zod: VERSIONS.zod },
        devDependencies: { tsx: VERSIONS.tsx },
        scripts: TSX,
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
