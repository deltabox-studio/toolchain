#!/usr/bin/env node
/**
 * Clone (or reuse) the `toolchain-tests` integration repo and optionally run
 * its test suite.
 *
 * Usage:
 *   yarn test:repo                       # clone the sibling repo when missing
 *   yarn test:repo --run                 # clone when missing, then `yarn test`
 *   yarn test:repo --repo <url>          # use a different git remote
 *   yarn test:repo --name <pkg-name>     # expect a different package.json name
 *   yarn test:repo --dir <path>          # clone into a custom directory
 *   yarn test:repo --depth 1             # shallow clone
 *   yarn test:repo --branch main         # clone a specific branch
 *   yarn test:repo --install --run       # install dependencies first
 *   yarn test:repo --force --run         # replace a non-matching checkout
 *
 * By default the repo is cloned next to this checkout (`../toolchain-tests`) so
 * it never becomes a nested git repository inside the toolchain repo.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_REPO_URL = 'https://github.com/deltabox-studio/toolchain-tests.git';
const DEFAULT_REPO_NAME = 'toolchain-tests';
const DEFAULT_PACKAGE_NAME = '@deltabox/toolchain-test';

interface Options {
    run: boolean;
    install: boolean;
    force: boolean;
    repoUrl: string;
    expectedName: string;
    target: string;
    depth?: string;
    branch?: string;
    testScript: string;
}

function log(message: string): void {
    console.log(`[test:repo] ${message}`);
}

function parseArgs(argv: string[]): Options {
    const root = fileURLToPath(new URL('..', import.meta.url));
    const parent = path.dirname(root);
    const options: Options = {
        run: false,
        install: false,
        force: false,
        repoUrl: DEFAULT_REPO_URL,
        expectedName: DEFAULT_PACKAGE_NAME,
        target: path.join(parent, DEFAULT_REPO_NAME),
        testScript: 'test',
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]!;
        const [flag, inline] = arg.startsWith('--') ? arg.split(/=(.*)/s, 2) : [arg, undefined];
        const value = (): string => {
            if (inline !== undefined && inline !== '') return inline;
            const next = argv[index + 1];
            if (next === undefined || next.startsWith('--')) {
                throw new Error(`${flag} requires a value.`);
            }
            index += 1;
            return next;
        };
        switch (flag) {
            case '--run':
                options.run = true;
                break;
            case '--install':
                options.install = true;
                break;
            case '--force':
                options.force = true;
                break;
            case '--repo':
                options.repoUrl = value();
                break;
            case '--name':
                options.expectedName = value();
                break;
            case '--dir':
                options.target = path.resolve(parent, value());
                break;
            case '--depth':
                options.depth = value();
                break;
            case '--branch':
                options.branch = value();
                break;
            case '--test':
                options.testScript = value();
                break;
            case '--help':
            case '-H':
                log(
                    'options: --run --install --force --repo <url> --name <pkg> --dir <path> --depth <n> --branch <ref> --test <script>'
                );
                process.exit(0);
                break;
            default:
                throw new Error(`unknown option: ${arg}`);
        }
    }

    if (!path.isAbsolute(options.target)) {
        options.target = path.resolve(parent, options.target);
    }
    if (options.target === root || options.target === parent) {
        throw new Error('refusing to clone into the repository root or its parent.');
    }
    return options;
}

function isRepo(target: string, expectedName: string): boolean {
    if (!fs.existsSync(path.join(target, '.git'))) return false;
    try {
        const pkg = JSON.parse(
            fs.readFileSync(path.join(target, 'package.json'), 'utf8').replace(/^\uFEFF/, '')
        ) as { name?: unknown };
        return pkg.name === expectedName;
    } catch {
        return false;
    }
}

function clone(options: Options): void {
    log(`cloning ${options.repoUrl} into ${options.target}`);
    const args = ['clone'];
    if (options.depth) args.push('--depth', options.depth);
    if (options.branch) args.push('--branch', options.branch);
    args.push(options.repoUrl, options.target);
    const result = spawnSync('git', args, {
        cwd: path.dirname(options.target),
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
        throw new Error(`git clone failed with exit code ${result.status ?? 'unknown'}.`);
    }
}

function runScript(options: Options, script: string): void {
    log(`running \`yarn ${script}\` in ${options.target}`);
    const result = spawnSync('yarn', [script], {
        cwd: options.target,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
        process.exitCode = result.status ?? 1;
    }
}

function main(): void {
    const options = parseArgs(process.argv.slice(2));

    if (fs.existsSync(options.target)) {
        if (!isRepo(options.target, options.expectedName)) {
            if (!options.force) {
                throw new Error(
                    `${options.target} exists but is not a ${options.expectedName} checkout ` +
                        '(expected a .git directory and the matching package.json name). ' +
                        'Pass --force to replace it, or use --dir to point elsewhere.'
                );
            }
            log(`removing non-matching checkout at ${options.target} (--force)`);
            fs.rmSync(options.target, { recursive: true, force: true });
            clone(options);
        } else {
            log(`${options.target} already exists; reusing it.`);
        }
    } else {
        clone(options);
    }

    if (!options.run) {
        log(`repository ready. Pass --run to run \`yarn ${options.testScript}\`.`);
        return;
    }
    if (options.install) runScript(options, 'install');
    runScript(options, options.testScript);
}

try {
    main();
} catch (error) {
    console.error(`[test:repo] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
