import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
    buildProjectGraph,
    detectPackageManager,
    orderProjects,
    readProjectGraph,
    writeProjectGraph,
} from '../src/graph.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-graph-'));
}

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value));
}

/** A small monorepo: `a` depends on `b`; both have dbx configs. */
function fixture(): string {
    const root = tmp();
    writeJson(path.join(root, 'package.json'), { name: 'root', workspaces: ['packages/*'] });
    fs.writeFileSync(path.join(root, 'yarn.lock'), '# yarn lockfile v1\n');
    writeJson(path.join(root, 'packages', 'b', 'package.json'), { name: '@acme/b' });
    fs.writeFileSync(path.join(root, 'packages', 'b', 'dbx.config.json'), '{}');
    writeJson(path.join(root, 'packages', 'a', 'package.json'), {
        name: '@acme/a',
        dependencies: { '@acme/b': 'workspace:*' },
    });
    fs.writeFileSync(path.join(root, 'packages', 'a', 'dbx.config.json'), '{}');
    // A non-dbx package + a node_modules entry that must be ignored.
    writeJson(path.join(root, 'packages', 'c', 'package.json'), { name: '@acme/c' });
    writeJson(path.join(root, 'node_modules', 'dep', 'package.json'), { name: 'dep' });
    writeJson(path.join(root, '.dbx/toolchain', 'manifest.json'), { files: [] });
    return root;
}

describe('buildProjectGraph', () => {
    it('discovers projects and ignores node_modules/.dbx/toolchain', () => {
        const root = fixture();
        const graph = buildProjectGraph(root);
        const names = graph.projects.map(p => p.name).sort();
        expect(names).toEqual(['@acme/a', '@acme/b', '@acme/c', 'root']);
        expect(graph.projects.some(p => p.name === 'dep')).toBe(false);
    });

    it('collects internal dependencies and dbx projects', () => {
        const root = fixture();
        const graph = buildProjectGraph(root);
        const a = graph.projects.find(p => p.name === '@acme/a');
        expect(a?.dependencies).toEqual(['@acme/b']);
        expect(graph.dbxProjects.map(p => p.name).sort()).toEqual(['@acme/a', '@acme/b']);
    });

    it('orders dbx projects dependencies-first', () => {
        const root = fixture();
        const graph = buildProjectGraph(root);
        expect(graph.order).toEqual(['packages/b', 'packages/a']);
    });

    it('detects the package manager from the lock file', () => {
        const root = fixture();
        expect(detectPackageManager(root)).toBe('yarn');
    });

    it('round-trips the graph through .dbx/toolchain/projects.json', () => {
        const root = fixture();
        const file = writeProjectGraph(root);
        expect(fs.existsSync(file)).toBe(true);
        const read = readProjectGraph(root);
        expect(read?.order).toEqual(['packages/b', 'packages/a']);
    });
});

describe('orderProjects', () => {
    it('breaks cycles without hanging', () => {
        const order = orderProjects([
            { dir: 'a', name: 'a', hasConfig: true, dependencies: ['b'] },
            { dir: 'b', name: 'b', hasConfig: true, dependencies: ['a'] },
        ]);
        expect(order.sort()).toEqual(['a', 'b']);
    });
});
