import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readProjectGraph, relatedWorkspacePaths } from '../src/index.js';

describe('relatedWorkspacePaths', () => {
    let root: string;

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'dbx-graph-'));
    });

    afterEach(() => {
        rmSync(root, { recursive: true, force: true });
    });

    function writeGraph(): void {
        mkdirSync(join(root, '.dbx', 'toolchain'), { recursive: true });
        writeFileSync(
            join(root, '.dbx', 'toolchain', 'projects.json'),
            JSON.stringify({
                projects: [
                    { name: '@x/root', dir: '.', dependencies: ['@x/a', '@x/b'] },
                    { name: '@x/a', dir: 'packages/a', dependencies: ['@x/shared'] },
                    { name: '@x/b', dir: 'packages/b', dependencies: ['@x/shared'] },
                    { name: '@x/shared', dir: 'packages/shared', dependencies: [] },
                ],
            })
        );
    }

    it('includes the workspace and its transitive dependencies', () => {
        writeGraph();
        expect(relatedWorkspacePaths(join(root, 'packages', 'a'), root)).toEqual([
            'packages/a',
            'packages/shared',
        ]);
    });

    it('returns just the workspace when it has no dependencies', () => {
        writeGraph();
        expect(relatedWorkspacePaths(join(root, 'packages', 'shared'), root)).toEqual([
            'packages/shared',
        ]);
    });

    it('falls back to the workspace dir without a graph', () => {
        expect(relatedWorkspacePaths(join(root, 'packages', 'a'), root)).toEqual(['packages/a']);
    });

    it('reads the graph only when present', () => {
        expect(readProjectGraph(root)).toBeUndefined();
        writeGraph();
        expect(readProjectGraph(root)?.length).toBe(4);
    });
});
