import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../types/index.js';
import { bun } from './bun.js';
import { express } from './express.js';
import { fastify } from './fastify.js';
import { bunS3FileServer } from './file-server-bun-s3.js';
import { fileServerMinio } from './file-server-minio.js';
import { rcloneFileServer } from './file-server-rclone.js';
import { fileServerS3 } from './file-server-s3.js';
import { localFileServer } from './file-server.js';
import { ollamaChat } from './ollama-chat.js';
import { orpc } from './orpc.js';
import { vitePress } from './vitepress.js';

/** The ids of the built-in project templates. */
export const PROJECT_TEMPLATE_IDS = [
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

/** A built-in project template id. */
export type ProjectTemplateId = (typeof PROJECT_TEMPLATE_IDS)[number];

/** Whether a value is a built-in project template id. */
export function isProjectTemplateId(value: string): value is ProjectTemplateId {
    return (PROJECT_TEMPLATE_IDS as readonly string[]).includes(value);
}

/** Build the files for a built-in project template. */
export function createProjectTemplateFiles(
    id: ProjectTemplateId,
    ctx: ProjectContext
): GeneratedFile[] {
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
            return fileServerS3(ctx);
        case 'file-server-minio':
            return fileServerMinio(ctx);
        case 'file-server-bun-s3':
            return bunS3FileServer(ctx);
        case 'file-server-rclone':
            return rcloneFileServer(ctx);
        case 'ollama-chat':
            return ollamaChat(ctx);
    }
}
