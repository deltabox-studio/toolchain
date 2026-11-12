import type { GeneratedFile } from '@deltabox/toolchain/shared';

import type { ProjectContext } from '../typescript.js';
import { s3FileServer } from './s3-file-server.js';

/** An AWS S3-backed file server template. */
export function fileServerS3(ctx: ProjectContext): GeneratedFile[] {
    return s3FileServer(ctx, false);
}
