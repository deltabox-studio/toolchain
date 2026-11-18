import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../types/index.js';
import { CONTENT_TYPES, file, readme, recipe, TSX, VERSIONS } from './shared.js';

export function renderS3Server(minio: boolean): string {
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

export function s3FileServer(ctx: ProjectContext, minio: boolean): GeneratedFile[] {
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
