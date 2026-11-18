import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../types/index.js';
import { s3FileServer } from './s3-file-server.js';

/** A MinIO-compatible S3 file server template. */
export function fileServerMinio(ctx: ProjectContext): GeneratedFile[] {
    return s3FileServer(ctx, true);
}
