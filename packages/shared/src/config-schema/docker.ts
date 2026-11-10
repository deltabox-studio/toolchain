import { z } from 'zod';

import { withEnabled } from './meta.js';

/** The runtime layout of a generated container. */
export const dockerRuntimeSchema = z
    .enum(['auto', 'node', 'static', 'bun'])
    .describe(
        'How the container runs: a Node.js server, a static/SSG site, or a Bun server ' +
            '(default `auto`, detected from `package.json`).'
    );

/** Dockerfile / compose generation for a project. */
export const dockerConfigSchema = withEnabled(
    z.object({
        image: z.string().describe('Container image name (default: the project name).').optional(),
        tag: z.string().describe('Container image tag (default `latest`).').optional(),
        port: z
            .number()
            .int()
            .min(1)
            .max(65535)
            .describe('Container port to expose (default 3000, or 80 for static sites).')
            .optional(),
        runtime: dockerRuntimeSchema.optional(),
        entry: z
            .string()
            .describe('Built entry file, relative to the project root (default `dist/index.js`).')
            .optional(),
        output: z
            .string()
            .describe('Build output directory (default `dist`, or the VitePress output).')
            .optional(),
        nodeVersion: z.string().describe('Node.js version for non-Vite+ images.').optional(),
        baseImage: z.string().describe('Override the build-stage base image.').optional(),
        runtimeImage: z.string().describe('Override the runtime base image.').optional(),
        user: z
            .string()
            .describe('Runtime user to run as (default `node`, `bun` or `nobody`).')
            .optional(),
        compose: z
            .boolean()
            .describe('Also write a `docker-compose.yml` (default false).')
            .optional(),
        healthcheck: z
            .boolean()
            .describe('Add a `HEALTHCHECK` to the runtime image (default true).')
            .optional(),
        healthcheckPath: z
            .string()
            .describe('HTTP path the healthcheck requests (default `/`).')
            .optional(),
        dockerfile: z.string().describe('Dockerfile name (default `Dockerfile`).').optional(),
        dockerignore: z
            .boolean()
            .describe('Write a `.dockerignore` alongside the Dockerfile (default true).')
            .optional(),
    })
)
    .describe('Dockerfile / compose generation for the project.')
    .meta({ id: 'ToolchainDockerConfig' });
