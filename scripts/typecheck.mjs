#!/usr/bin/env node
/**
 * Development typecheck: the root `tsconfig.json` plus every workspace's
 * `tsconfig.json` (which also includes the tests). CI uses the narrower
 * `tsconfig.build.json` tasks via `yarn typecheck:ci`.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const ignored = new Set(['node_modules', 'dist', '.git', '.dbx', '.vitest']);

function projects() {
    const out = [root];
    const packages = path.join(root, 'packages');
    if (fs.existsSync(packages)) {
        for (const entry of fs.readdirSync(packages, { withFileTypes: true })) {
            if (!entry.isDirectory() || ignored.has(entry.name)) continue;
            const dir = path.join(packages, entry.name);
            if (fs.existsSync(path.join(dir, 'tsconfig.json'))) out.push(dir);
        }
    }
    return out;
}

let failed = 0;
for (const dir of projects()) {
    const label = path.relative(root, dir) || '.';
    process.stdout.write(`\n› typecheck ${label}\n`);
    try {
        execFileSync(process.execPath, [tsc, '-p', path.join(dir, 'tsconfig.json'), '--noEmit'], {
            cwd: dir,
            stdio: 'inherit',
        });
    } catch {
        failed += 1;
    }
}

if (failed > 0) {
    console.error(`\ntypecheck failed in ${failed} project(s).`);
    process.exit(1);
}
process.stdout.write('\ntypecheck passed.\n');
