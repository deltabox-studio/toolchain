import { describe, expect, it } from 'vite-plus/test';

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

    it('quotes scalars ending in a colon', () => {
        expect(toYaml({ name: 'Deploy:' })).toContain('name: "Deploy:"');
        expect(toYaml({ script: ['echo done:'] })).toContain('script: ["echo done:"]');
    });

    it('quotes flow indicators inside inline arrays', () => {
        expect(toYaml({ paths: ['src/**/*.{ts,tsx}'] })).toContain('paths: ["src/**/*.{ts,tsx}"]');
        expect(toYaml({ labels: ['deps,js', 'backend'] })).toContain(
            'labels: ["deps,js", backend]'
        );
        expect(toYaml({ a: ['x]y', 'z{w'] })).toContain('a: ["x]y", "z{w"]');
    });

    it('uses an indentation indicator for indented or blank first lines', () => {
        expect(toYaml({ run: '  a\nb' })).toContain('run: |2-');
        expect(toYaml({ a: '\n   \nx' })).toContain('a: |2-');
    });

    it('keeps extra trailing newlines with + chomping', () => {
        expect(toYaml({ a: 'x\n\n\n' })).toContain('a: |+');
        expect(toYaml({ a: '\n' })).toContain('a: |2+');
    });

    it('quotes non-decimal numbers and date-like strings', () => {
        const yaml = toYaml({ a: '0x10', b: '0b101', c: '0o17', d: '2020-01-01', e: '.inf' });
        expect(yaml).toContain('a: "0x10"');
        expect(yaml).toContain('b: "0b101"');
        expect(yaml).toContain('c: "0o17"');
        expect(yaml).toContain('d: "2020-01-01"');
        expect(yaml).toContain('e: ".inf"');
    });
});
