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

describe('toYaml escaping edge cases', () => {
    it('quotes and escapes newlines inside arrays', () => {
        const yaml = toYaml({ a: ['x\ny'] });
        expect(yaml).toContain('a: ["x\\ny"]');
    });

    it('escapes quotes and backslashes in keys', () => {
        const yaml = toYaml({ 'a"b': 'v', 'a\\b': 'w' });
        expect(yaml).toContain('"a\\"b": v');
        expect(yaml).toContain('"a\\\\b": w');
    });

    it('quotes boolean-like keys other than `on`', () => {
        const yaml = toYaml({ true: 'v', null: 'n', on: { push: null } });
        expect(yaml).toContain('"true": v');
        expect(yaml).toContain('"null": n');
        expect(yaml).toContain('on:');
    });

    it('uses |- when a block scalar has no trailing newline', () => {
        expect(toYaml({ run: 'echo one\necho two' })).toContain('run: |-');
        expect(toYaml({ run: 'echo one\necho two\n' })).toContain('run: |');
    });
});
