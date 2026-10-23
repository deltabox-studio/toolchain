import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { detectProjectType, resolveProjectType } from '../src/project-type.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-type-'));
}

describe('detectProjectType', () => {
    it('detects a monorepo root from workspaces', () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, 'package.json'),
            JSON.stringify({ workspaces: ['packages/*'] })
        );
        expect(detectProjectType(cwd)).toBe('monorepo-root');
    });

    it('detects a monorepo root from tsconfig.workspaces.json', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'tsconfig.workspaces.json'), '{}');
        expect(detectProjectType(cwd)).toBe('monorepo-root');
    });

    it('honours a custom workspaces/default file name', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'tsconfig.mono.json'), '{}');
        expect(detectProjectType(cwd, { rootFile: 'tsconfig.mono.json' })).toBe('monorepo-root');

        const ws = tmp();
        fs.writeFileSync(path.join(ws, 'tsconfig.ws.json'), '{}');
        expect(detectProjectType(ws, { defaultFile: 'tsconfig.ws.json' })).toBe(
            'monorepo-workspace'
        );
    });

    it('detects a monorepo workspace from tsconfig.default.json', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'pkg' }));
        fs.writeFileSync(path.join(cwd, 'tsconfig.default.json'), '{}');
        expect(detectProjectType(cwd)).toBe('monorepo-workspace');
    });

    it('defaults to a single project', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'app' }));
        expect(detectProjectType(cwd)).toBe('project');
    });
});

describe('resolveProjectType', () => {
    it('honours an explicit config.project.type', () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, 'package.json'),
            JSON.stringify({ workspaces: ['packages/*'] })
        );
        expect(resolveProjectType(cwd, { project: { type: 'project' } })).toBe('project');
    });

    it('falls back to detection', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'tsconfig.workspaces.json'), '{}');
        expect(resolveProjectType(cwd, {})).toBe('monorepo-root');
    });
});
