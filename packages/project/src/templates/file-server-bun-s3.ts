import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../typescript.js';
import { BUN, bunTsconfig, file, readme, recipe, VERSIONS } from './shared.js';

export function bunS3FileServer(ctx: ProjectContext): GeneratedFile[] {
    return recipe(ctx, {
        devDependencies: { '@types/bun': VERSIONS['@types/bun'] },
        scripts: BUN,
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
