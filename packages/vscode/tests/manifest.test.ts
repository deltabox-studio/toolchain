import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const manifest = JSON.parse(
    fs.readFileSync(
        path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'),
        'utf-8'
    )
) as {
    contributes?: {
        configuration?: {
            properties?: Record<string, { type?: string; default?: unknown }>;
        };
    };
};

describe('extension manifest', () => {
    it('exposes the opt-in containerize setting', () => {
        expect(
            manifest.contributes?.configuration?.properties?.[
                'deltabox.toolchain.containerizeTemplates'
            ]
        ).toMatchObject({ type: 'boolean', default: false });
    });
});
