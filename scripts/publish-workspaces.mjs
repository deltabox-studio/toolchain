/**
 * Publish every stale, public workspace package to npm.
 *
 * The root `@deltabox/toolchain` is published by the release job itself. This
 * script handles the publishable `packages/*` workspaces: each package is skipped
 * when it is private, has no name/version, or that version already exists on the
 * registry. Stale packages are packed and published (falling back to a staged
 * publish, which trusted publishing always permits).
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = path.join(root, 'packages');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-publish-'));

function run(command, args, options = {}) {
    return execFileSync(command, args, {
        cwd: root,
        stdio: 'inherit',
        ...options,
    });
}

function runQuiet(command, args, options = {}) {
    try {
        execFileSync(command, args, { cwd: root, stdio: 'ignore', ...options });
        return true;
    } catch {
        return false;
    }
}

/** The npm dist-tag for a version (`3.0.0-beta.1` -> `beta`, stable -> `latest`). */
function distTag(version) {
    const prerelease = version.split('-', 2)[1];
    return prerelease ? prerelease.split(/[.+]/)[0] : 'latest';
}

const dirs = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

let published = 0;
let skipped = 0;

for (const dir of dirs) {
    const cwd = path.join(packagesDir, dir);
    const manifestPath = path.join(cwd, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (pkg.private === true) continue;
    if (!pkg.name || !pkg.version) continue;

    const spec = `${pkg.name}@${pkg.version}`;
    // `npm view` exits non-zero for a version that is not on the registry yet.
    if (runQuiet('npm', ['view', spec, 'version'])) {
        console.log(`skip ${spec}: already published`);
        skipped += 1;
        continue;
    }

    const tarball = path.join(
        outDir,
        `${pkg.name.replace(/^@/, '').replace(/[/]/g, '-')}-${pkg.version}.tgz`
    );
    // npm rejects a prerelease without an explicit dist-tag.
    const tag = distTag(pkg.version);
    const publishArgs = ['--access', 'public', '--tag', tag];
    console.log(`publish ${spec} (npm tag: ${tag})`);
    run('yarn', ['pack', '--out', tarball], { cwd });
    try {
        run('npm', ['publish', tarball, ...publishArgs]);
    } catch {
        console.warn(`direct publish failed for ${spec}; falling back to a staged publish`);
        run('npm', ['stage', 'publish', tarball, ...publishArgs]);
    }
    published += 1;
}

console.log(`done: ${published} published, ${skipped} already up to date`);
