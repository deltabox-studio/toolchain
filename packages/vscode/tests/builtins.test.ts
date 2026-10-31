import { beforeEach, describe, expect, it, vi } from 'vitest';

const { captureCli } = vi.hoisted(() => ({ captureCli: vi.fn() }));

vi.mock('vscode', () => ({}));
vi.mock('../src/cli.js', () => ({ captureCli }));

import {
    BUILTIN_PROVIDERS,
    BUILTIN_TEMPLATES,
    withBuiltinProviders,
    withBuiltinTemplates,
} from '../src/builtins.js';
import { loadProviders } from '../src/providers.js';
import { loadTemplates } from '../src/templates.js';

beforeEach(() => captureCli.mockReset());

describe('builtin providers', () => {
    it('always exposes Vite+ with its commands', () => {
        const vite = BUILTIN_PROVIDERS.find(provider => provider.id === 'vite-plus');
        expect(vite).toBeDefined();
        expect(vite?.commands.length).toBeGreaterThan(0);
        expect(vite?.commands.map(command => command.name)).toContain('vite:dev');
    });

    it('prepends the builtins and dedupes by id', () => {
        const merged = withBuiltinProviders([
            { id: 'vite-plus', name: 'Override', commands: [] },
            { id: 'custom', name: 'Custom', commands: [] },
        ]);
        expect(merged[0]?.id).toBe('vite-plus');
        expect(merged[0]?.name).toBe('Vite+');
        expect(merged.some(provider => provider.id === 'custom')).toBe(true);
        expect(merged.filter(provider => provider.id === 'vite-plus')).toHaveLength(1);
    });

    it('falls back to the builtins when the CLI fails', async () => {
        captureCli.mockResolvedValueOnce({ code: 1, stdout: '', stderr: 'failed' });
        const providers = await loadProviders('C:/project');
        expect(providers.some(provider => provider.id === 'vite-plus')).toBe(true);
    });

    it('merges the builtins with a successful CLI list', async () => {
        captureCli.mockResolvedValueOnce({
            code: 0,
            stdout: JSON.stringify([{ id: 'custom', name: 'Custom', commands: [] }]),
            stderr: '',
        });
        const providers = await loadProviders('C:/project');
        expect(providers.map(provider => provider.id)).toEqual(['vite-plus', 'custom']);
    });
});

describe('builtin templates', () => {
    it('includes the offline and Vite+ builtins', () => {
        const ids = BUILTIN_TEMPLATES.map(template => template.id);
        expect(ids).toEqual(
            expect.arrayContaining([
                'project',
                'application',
                'monorepo',
                'workspace',
                'vite-plus',
                'vite-plus-application',
            ])
        );
    });

    it('prepends the builtins and dedupes by id', () => {
        const merged = withBuiltinTemplates([
            { id: 'project', name: 'Override' },
            { id: 'local', name: 'Local' },
        ]);
        expect(merged[0]?.name).toBe('TypeScript project');
        expect(merged.some(template => template.id === 'local')).toBe(true);
        expect(merged.filter(template => template.id === 'project')).toHaveLength(1);
    });

    it('falls back to the builtins when the CLI fails', async () => {
        captureCli.mockResolvedValueOnce({ code: 1, stdout: '', stderr: 'failed' });
        const templates = await loadTemplates('C:/project');
        expect(templates.some(template => template.id === 'project')).toBe(true);
    });

    it('merges the builtins with a successful CLI list', async () => {
        captureCli.mockResolvedValueOnce({
            code: 0,
            stdout: JSON.stringify([{ id: 'local', name: 'Local', kind: 'folder' }]),
            stderr: '',
        });
        const templates = await loadTemplates('C:/project');
        expect(templates[0]?.id).toBe('project');
        expect(templates.some(template => template.id === 'local')).toBe(true);
    });
});
