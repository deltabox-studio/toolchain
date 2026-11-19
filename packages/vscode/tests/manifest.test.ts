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
        colors?: Array<{ id?: string; defaults?: Record<string, string> }>;
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

    it('contributes the managed-file decoration color per theme', () => {
        const color = manifest.contributes?.colors?.find(
            entry => entry.id === 'deltabox.managedFileForeground'
        );
        expect(color?.defaults).toMatchObject({
            dark: '#1763D6CC',
            light: '#174D9FCC',
            highContrast: '#3794FFFF',
            highContrastLight: '#174D9FCC',
        });
    });

    it('lets managed-file decorations be disabled (default on)', () => {
        expect(
            manifest.contributes?.configuration?.properties?.[
                'deltabox.toolchain.decorateManagedFiles'
            ]
        ).toMatchObject({ type: 'boolean', default: true });
    });
});
