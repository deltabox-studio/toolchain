import { describe, expect, it } from 'vitest';

import { toYaml } from '../src/yaml.js';

describe('toYaml', () => {
    it('emits maps, inline arrays and quoted scalars', () => {
        const yaml = toYaml({
            name: 'CI',
            on: { push: { branches: ['main'] } },
            jobs: { ci: { 'runs-on': 'ubuntu-latest' } },
        });
        expect(yaml).toContain('name: CI');
        expect(yaml).toContain('branches: [main]');
        expect(yaml).toContain('runs-on: ubuntu-latest');
    });

    it('quotes booleans-like strings and expressions', () => {
        const yaml = toYaml({ a: 'true', b: '${{ secrets.TOKEN }}', c: '22', d: 'main' });
        expect(yaml).toContain('a: "true"');
        expect(yaml).toContain('b: "${{ secrets.TOKEN }}"');
        expect(yaml).toContain('c: "22"');
        expect(yaml).toContain('d: main');
    });

    it('emits multi-line strings as block scalars', () => {
        const yaml = toYaml({ run: 'echo one\necho two' });
        expect(yaml).toContain('run: |');
        expect(yaml).toContain('echo one');
        expect(yaml).toContain('echo two');
    });

    it('emits arrays of maps with a leading dash', () => {
        const yaml = toYaml({ steps: [{ name: 'a', uses: 'actions/x@v1' }, { run: 'x' }] });
        expect(yaml).toContain('steps:');
        expect(yaml).toContain('- name: a');
        expect(yaml).toContain('uses: actions/x@v1');
        expect(yaml).toContain('- run: x');
    });

    it('keeps the `on` key unquoted', () => {
        expect(toYaml({ on: { push: null } })).toContain('on:');
    });
});
