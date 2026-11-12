import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
    dockerFiles,
    dockerImageName,
    renderCompose,
    renderDockerfile,
    resolveDockerPlan,
} from '../src/index.js';

const dirs: string[] = [];

function project(pkg: Record<string, unknown>): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-docker-'));
    dirs.push(dir);
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg), 'utf-8');
    return dir;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('docker plans', () => {
    it('detects a Node server and renders a multi-stage Vite+ build', () => {
        const cwd = project({
            name: '@acme/api',
            engines: { node: '>=22' },
            scripts: { build: 'vp pack', start: 'node dist/index.js' },
            packageManager: 'pnpm@10.11.1',
        });

        const plan = resolveDockerPlan({ cwd, vitePlus: true });
        expect(plan).toMatchObject({
            runtime: 'node',
            packageManager: 'pnpm',
            nodeVersion: '22',
            image: 'api',
            port: 3000,
            entry: 'dist/index.js',
            output: 'dist',
            user: 'nobody',
        });
        expect(plan.baseImage).toContain('vite-plus');

        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('AS build');
        expect(dockerfile).toContain('AS deps');
        expect(dockerfile).toContain('AS runtime');
        expect(dockerfile).toContain('vp install --frozen-lockfile');
        expect(dockerfile).toContain('vp env which node');
        expect(dockerfile).toContain('USER nobody');
        expect(dockerfile).toContain('EXPOSE 3000');
        expect(dockerfile).toContain('HEALTHCHECK');
        expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
    });

    it('detects a VitePress static site and serves it with unprivileged nginx', () => {
        const cwd = project({
            name: 'docs',
            scripts: { build: 'vitepress build docs' },
        });

        const plan = resolveDockerPlan({ cwd, vitePlus: true });
        expect(plan.runtime).toBe('static');
        expect(plan.output).toBe('docs/.vitepress/dist');
        expect(plan.port).toBe(8080);
        expect(plan.runtimeImage).toContain('nginx-unprivileged');

        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('ghcr.io/voidzero-dev/vite-plus');
        expect(dockerfile).toContain('RUN vp build');
        expect(dockerfile).toContain('/usr/share/nginx/html');
        expect(dockerfile).toContain('wget -qO- http://127.0.0.1:8080/');
    });

    it('uses the Bun images and commands for Bun projects', () => {
        const cwd = project({
            name: 'bun-api',
            packageManager: 'bun@1.3.0',
            scripts: {
                build: 'bun build src/index.ts --outdir dist --target bun',
                start: 'bun src/index.ts',
            },
        });

        const plan = resolveDockerPlan({ cwd, vitePlus: true });
        expect(plan.runtime).toBe('bun');
        expect(plan.baseImage).toBe('oven/bun:1');
        expect(plan.runtimeImage).toBe('oven/bun:1-slim');
        expect(plan.user).toBe('bun');

        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('RUN bun install --frozen-lockfile');
        expect(dockerfile).toContain('bun.lock*');
        expect(dockerfile).not.toContain('bun.lockb');
        expect(dockerfile).toContain('RUN bun run build');
        expect(dockerfile).toContain('CMD ["bun", "dist/index.js"]');
    });

    it('uses a neutral header for user-owned files', () => {
        const cwd = project({ name: 'plain' });
        const plan = resolveDockerPlan({ cwd });
        const dockerfile = renderDockerfile(plan);

        expect(dockerfile).toContain('this file is yours to edit');
        expect(dockerfile).not.toContain('dbx.config');
        expect(dockerfile).not.toContain('dbx sync');
    });

    it('falls back to Node images for non-Vite+ projects', () => {
        const cwd = project({
            name: 'plain',
            engines: { node: '24.1.0' },
            scripts: { build: 'tsc', start: 'node dist/index.js' },
            packageManager: 'npm@11.0.0',
        });

        const plan = resolveDockerPlan({ cwd });
        expect(plan.vitePlus).toBe(false);
        expect(plan.nodeVersion).toBe('24');
        expect(plan.baseImage).toBe('node:24-bookworm-slim');
        expect(plan.user).toBe('node');

        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('RUN npm ci');
        expect(dockerfile).not.toContain('vite-plus');
        expect(dockerfile).toContain('USER node');
    });

    it('honours config overrides and writes the optional compose file', () => {
        const cwd = project({ name: 'svc', scripts: { start: 'node dist/index.js' } });
        const files = dockerFiles({
            cwd,
            image: 'registry.example.com/acme/svc',
            tag: 'v1',
            port: 8081,
            entry: 'dist/server.js',
            healthcheck: false,
            compose: true,
            dockerignore: true,
        });

        expect(files.map(file => file.path)).toEqual([
            'Dockerfile',
            '.dockerignore',
            'docker-compose.yaml',
        ]);
        const compose = files.find(file => file.path === 'docker-compose.yaml')!;
        expect(compose.content).toContain('image: registry.example.com/acme/svc:v1');
        expect(compose.content).toContain('- "8081:8081"');
        expect(files[0]!.content).toContain('CMD ["node", "dist/server.js"]');
        expect(files[0]!.content).not.toContain('HEALTHCHECK');
        expect(renderCompose(resolveDockerPlan({ cwd, compose: true }))).toContain('services:');
    });

    it('sanitizes image names', () => {
        expect(dockerImageName('@acme/my app')).toBe('my-app');
        expect(dockerImageName('@acme/core')).toBe('core');
        expect(dockerImageName('!!!')).toBe('app');
    });
});
