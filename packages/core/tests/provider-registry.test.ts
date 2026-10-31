import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
    addProjectProviderRegistry,
    providerRegistryPaths,
    readAllProvidersSync,
} from '../src/provider-registry.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-providers-'));
    dirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function provider(id: string): Record<string, unknown> {
    return {
        id,
        name: id,
        binary: 'echo',
        commands: [{ name: `${id}:run`, subcommand: 'run', description: 'Run it' }],
    };
}

describe('provider registry search paths', () => {
    it('loads a project provider registry directory', () => {
        const cwd = tmp();
        const registry = path.join(cwd, 'providers');
        fs.mkdirSync(registry, { recursive: true });
        fs.writeFileSync(path.join(registry, 'providers.json'), JSON.stringify([provider('acme')]));
        addProjectProviderRegistry(cwd, './providers');

        expect(providerRegistryPaths(cwd).map(entry => entry.path)).toContain(registry);
        expect(readAllProvidersSync(cwd).map(item => item.id)).toContain('acme');
    });

    it('honours the registry policy', () => {
        const cwd = tmp();
        const registry = path.join(cwd, 'providers');
        fs.mkdirSync(registry, { recursive: true });
        fs.writeFileSync(
            path.join(registry, 'providers.json'),
            JSON.stringify([provider('blocked')])
        );
        addProjectProviderRegistry(cwd, './providers');

        expect(
            readAllProvidersSync(cwd, { deny: [path.resolve(registry)] }).map(item => item.id)
        ).not.toContain('blocked');
        expect(
            readAllProvidersSync(cwd, { allow: [path.resolve(registry)] }).map(item => item.id)
        ).toContain('blocked');
    });
});
