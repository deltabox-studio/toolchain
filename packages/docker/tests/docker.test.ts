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
        expect(dockerfile).toContain('vp install');
        expect(dockerfile).not.toContain('vp install --frozen-lockfile');
        expect(dockerfile).toContain('vp env which node');
        expect(dockerfile).toContain('USER nobody');
        expect(dockerfile).toContain('ENV HOST=0.0.0.0');
        expect(dockerfile).toContain('ENV PORT=3000');
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
        expect(dockerfile).toContain('RUN vp run build');
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
        expect(dockerfile).toContain('RUN bun install');
        expect(dockerfile).toContain('RUN bun run build');
        expect(dockerfile).toContain('CMD ["bun", "dist/index.js"]');
        expect(dockerfile).not.toContain('AS deps');
    });

    it('installs with npm in a Node stage for a Bun runtime (no npm in the Bun image)', () => {
        const cwd = project({
            name: 'bun-npm',
            packageManager: 'npm@11.0.0',
            scripts: { build: 'bun build src/index.ts', start: 'bun src/index.ts' },
        });

        const plan = resolveDockerPlan({ cwd });
        expect(plan.runtime).toBe('bun');
        expect(plan.packageManager).toBe('npm');

        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('FROM node:22-bookworm-slim AS deps');
        expect(dockerfile).toContain('RUN npm install');
        expect(dockerfile).toContain('COPY --from=deps /app ./');
        expect(dockerfile).toContain('RUN bun run build');
        expect(dockerfile).not.toContain('FROM oven/bun:1 AS deps');
    });

    it('uses one package manager for both COPY sources and install (Bun runtime, no declaration)', () => {
        const cwd = project({
            name: 'bun-api',
            scripts: {
                build: 'bun build src/index.ts --outdir dist --target bun',
                start: 'bun src/index.ts',
            },
        });

        const plan = resolveDockerPlan({ cwd });
        expect(plan.runtime).toBe('bun');
        expect(plan.packageManager).toBe('bun');

        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('COPY package.json ./');
        expect(dockerfile).not.toContain('yarn.lock');
        expect(dockerfile).not.toContain('.yarnrc.yml');
        expect(dockerfile).toContain('RUN bun install');
    });

    it('copies only sources that exist on a fresh scaffold', () => {
        const cwd = project({
            name: 'fresh',
            scripts: { build: 'vp pack', start: 'node dist/index.js' },
            packageManager: 'yarn@4.17.1',
        });

        const plan = resolveDockerPlan({ cwd, vitePlus: true });
        const dockerfile = renderDockerfile(plan);

        expect(plan.installSources).toEqual(['package.json']);
        expect(dockerfile).not.toContain('.node-version');
        expect(dockerfile).not.toContain('yarn.lock');
        const copyLines = dockerfile
            .split('\n')
            .filter(
                line =>
                    line.includes('COPY') &&
                    line.includes('package.json') &&
                    !line.includes('--from')
            );
        for (const line of copyLines) {
            const sources = line
                .replace(/^COPY\s+(?:--chown=\S+\s+)?/, '')
                .replace(/\s+\.\/$/, '')
                .split(/\s+/);
            for (const source of sources) {
                expect(
                    source.includes('*') || fs.existsSync(path.join(cwd, source)),
                    `${source} should exist`
                ).toBe(true);
            }
        }
    });

    it('uses a declared package manager even when the runtime is Bun', () => {
        const cwd = project({
            name: 'bun-yarn',
            packageManager: 'yarn@4.17.1',
            scripts: { build: 'bun build src/index.ts', start: 'bun src/index.ts' },
        });
        fs.writeFileSync(path.join(cwd, 'yarn.lock'), '');

        const plan = resolveDockerPlan({ cwd });
        expect(plan.runtime).toBe('bun');
        expect(plan.packageManager).toBe('yarn');

        const dockerfile = renderDockerfile(plan);
        expect(plan.installSources).toContain('yarn.lock');
        // The declared manager installs in a Node stage; Bun only builds.
        expect(dockerfile).toContain('FROM node:22-bookworm-slim AS deps');
        expect(dockerfile).toMatch(/COPY --from=deps \/app \.\//);
        expect(dockerfile).toContain('corepack enable && yarn install --immutable');
        expect(dockerfile).toContain('RUN bun run build');
        expect(dockerfile).not.toContain('bun install');
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
        fs.writeFileSync(path.join(cwd, 'package-lock.json'), '{}');

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

    it('skips the build step when package.json has no build script', () => {
        const cwd = project({ name: 'noscript', scripts: { start: 'node server.js' } });
        const plan = resolveDockerPlan({ cwd });

        expect(plan.hasBuildScript).toBe(false);
        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).not.toMatch(/RUN (?:yarn|npm|pnpm|bun) run build/);
        expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
    });

    it('treats a plain Vite app as a static site', () => {
        const cwd = project({ name: 'viteapp', scripts: { build: 'vite build' } });
        const plan = resolveDockerPlan({ cwd });

        expect(plan.runtime).toBe('static');
        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('RUN yarn run build');
        expect(dockerfile).toContain('COPY --from=build /app/dist /usr/share/nginx/html');
        expect(dockerfile).not.toContain('CMD ["node"');
    });

    it('publishes the server port and binds all interfaces', () => {
        const cwd = project({
            name: 'svc-port',
            scripts: { build: 'tsc', start: 'node dist/index.js' },
        });
        const plan = resolveDockerPlan({ cwd, port: 8081, compose: true });

        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('ENV HOST=0.0.0.0');
        expect(dockerfile).toContain('ENV PORT=8081');
        expect(dockerfile).toContain('EXPOSE 8081');
        expect(renderCompose(plan)).toContain('- "8081:8081"');
    });

    it('reconfigures nginx when a static site uses a non-default port', () => {
        const cwd = project({ name: 'docs-port', scripts: { build: 'vitepress build docs' } });
        const plan = resolveDockerPlan({ cwd, port: 3000 });

        expect(renderDockerfile(plan)).toContain('s/8080/3000/g');
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

describe('docker dependency sources', () => {
    it('builds a Node runtime with the Bun image when Bun is the package manager', () => {
        const cwd = project({
            name: 'node-bun',
            packageManager: 'bun@1.3.0',
            scripts: { build: 'tsc', start: 'node dist/index.js' },
        });

        const plan = resolveDockerPlan({ cwd });
        expect(plan.runtime).toBe('node');
        expect(plan.packageManager).toBe('bun');
        expect(plan.baseImage).toBe('oven/bun:1');
        expect(plan.runtimeImage).toBe('node:22-bookworm-slim');

        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('FROM oven/bun:1 AS build');
        expect(dockerfile).not.toContain('FROM node:22-bookworm-slim AS build');
        expect(dockerfile).toContain('RUN bun install');
        expect(dockerfile).toContain('RUN bun run build');
    });

    it('copies the Yarn release/patches directories before installing', () => {
        const cwd = project({
            name: 'yarn-path',
            packageManager: 'yarn@4.17.1',
            scripts: { build: 'tsc', start: 'node dist/index.js' },
        });
        fs.writeFileSync(path.join(cwd, 'yarn.lock'), '');
        fs.writeFileSync(
            path.join(cwd, '.yarnrc.yml'),
            'yarnPath: .yarn/releases/yarn-4.17.1.cjs\nnodeLinker: node-modules\n'
        );
        fs.mkdirSync(path.join(cwd, '.yarn', 'releases'), { recursive: true });
        fs.writeFileSync(path.join(cwd, '.yarn', 'releases', 'yarn-4.17.1.cjs'), '');
        fs.mkdirSync(path.join(cwd, '.yarn', 'patches'), { recursive: true });

        const plan = resolveDockerPlan({ cwd });
        expect(plan.installSources).toEqual([
            'package.json',
            'yarn.lock',
            '.yarnrc.yml',
            '.yarn/releases',
            '.yarn/patches',
        ]);
        const dockerfile = renderDockerfile(plan);
        expect(dockerfile).toContain('COPY package.json yarn.lock .yarnrc.yml ./');
        expect(dockerfile).toContain('COPY .yarn/releases ./.yarn/releases');
        expect(dockerfile).toContain('COPY .yarn/patches ./.yarn/patches');
    });

    it('keeps the minimal Yarn COPY list without a `.yarn` directory', () => {
        const cwd = project({
            name: 'yarn-plain',
            packageManager: 'yarn@4.17.1',
            scripts: { build: 'tsc', start: 'node dist/index.js' },
        });
        fs.writeFileSync(path.join(cwd, 'yarn.lock'), '');
        fs.writeFileSync(path.join(cwd, '.yarnrc.yml'), 'nodeLinker: node-modules\n');

        expect(resolveDockerPlan({ cwd }).installSources).toEqual([
            'package.json',
            'yarn.lock',
            '.yarnrc.yml',
        ]);
    });
});
