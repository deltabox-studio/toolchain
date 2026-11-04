import { describe, expect, it } from 'vitest';

import { applyOverrides, deepMerge } from '../src/index.js';

describe('deepMerge prototype safety', () => {
    it('ignores an own __proto__ key from parsed JSON', () => {
        const payload = JSON.parse('{"__proto__":{"polluted":true}}') as Record<string, unknown>;
        const result = deepMerge({}, payload);
        expect((result as { polluted?: boolean }).polluted).toBeUndefined();
        expect(Object.hasOwn(result, '__proto__')).toBe(false);
        expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    });

    it('ignores __proto__ in applyOverrides', () => {
        const result = applyOverrides({}, JSON.parse('{"__proto__":{"polluted":true}}'));
        expect((result as { polluted?: boolean }).polluted).toBeUndefined();
        expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    });
});
