import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { runChangelog } from '../src/run.js';

describe('runChangelog --version', () => {
    const originalCwd = process.cwd();
    let dir: string | undefined;

    afterEach(() => {
        process.chdir(originalCwd);
        if (dir) fs.rmSync(dir, { recursive: true, force: true });
        dir = undefined;
    });

    it('does not write when --dry-run is set', () => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-changelog-dry-'));
        fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x","version":"1.0.0"}\n');
        fs.writeFileSync(
            path.join(dir, 'CHANGELOG.md'),
            '# Changelog\n\n## 1.0.0 (January 2026)\n\n- Initial release.\n'
        );
        process.chdir(dir);

        runChangelog(['--version', '2.0.0', '--dry-run']);

        expect(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')).version).toBe(
            '1.0.0'
        );
        expect(fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf-8')).toContain('## 1.0.0');
        expect(fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf-8')).not.toContain('## 2.0.0');
    });
});
