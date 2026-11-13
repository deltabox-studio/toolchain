import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite-plus/pack';
import { describe, expect, it, vi } from 'vite-plus/test';

import { cleanup } from '../src/cleanup.js';
import {
    baseTsdownConfig,
    createPostBanner,
    createTsdownConfig,
    sortPackageExports,
} from '../src/config/node.js';
import {
    createNodeModulesLeakReporter,
    formatNodeModulesLeakMessage,
    NODE_MODULES_LEAK_REPORTER,
} from '../src/config/reporter.js';

/** Create a tiny package whose public type comes from a dev-only `type-fest`. */
function typeFestFixture(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tsdown-dts-'));
    const typeFest = fileURLToPath(new URL('../../../node_modules/type-fest', import.meta.url));
    fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true });
    fs.symlinkSync(
        typeFest,
        path.join(dir, 'node_modules', 'type-fest'),
        process.platform === 'win32' ? 'junction' : 'dir'
    );
    fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({
            name: 'fixture',
            version: '1.0.0',
            type: 'module',
            devDependencies: { 'type-fest': '*' },
        })
    );
    const tsconfig = JSON.stringify({
        compilerOptions: {
            strict: true,
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            skipLibCheck: true,
        },
        include: ['index.ts'],
    });
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), tsconfig);
    fs.writeFileSync(path.join(dir, 'tsconfig.build.json'), tsconfig);
    fs.writeFileSync(
        path.join(dir, 'index.ts'),
        "import type { JsonObject } from 'type-fest';\nexport type Payload = JsonObject;\n"
    );
    return dir;
}

/** The minimal tsdown config used by the fixture builds. */
function fixtureConfig(dir: string) {
    return {
        cwd: dir,
        entry: { index: 'index.ts' },
        clean: false,
        minify: false,
        publint: false,
        exports: false,
        hooks: {},
    } as const;
}

describe('cleanup', () => {
    it('returns [] when no patterns are given', () => {
        expect(cleanup('build', [])).toEqual([]);
    });

    it('ignores node_modules by default', () => {
        const removed = cleanup('build', ['**/node_modules/**'], { silent: true });
        expect(removed).toEqual([]);
    });
});

describe('tsdown config helpers', () => {
    it('exposes a base config', () => {
        expect(baseTsdownConfig.platform).toBe('node');
        expect(baseTsdownConfig.dts).toEqual({ generator: 'tsgo' });
        const plugins = baseTsdownConfig.plugins as { name?: string }[];
        expect(plugins.some(plugin => plugin.name === NODE_MODULES_LEAK_REPORTER)).toBe(true);
    });

    it('externalizes dts package specifiers as written, not resolved node_modules paths', () => {
        // A `/node_modules/` matcher externalizes the *resolved* absolute path,
        // which leaks into `.d.ts` imports. The dts override keeps bare
        // specifiers bare; JS bundling keeps its path-based rule.
        expect(baseTsdownConfig.deps?.dts?.neverBundle).toBe(true);
        expect(baseTsdownConfig.deps?.neverBundle).not.toBe(true);
    });

    it('does not bake absolute node_modules paths into emitted d.ts', async () => {
        const dir = typeFestFixture();
        try {
            await build(createTsdownConfig(fixtureConfig(dir)));

            const dts = fs.readFileSync(path.join(dir, 'dist', 'index.d.ts'), 'utf8');
            expect(dts).toContain('from "type-fest"');
            expect(dts).not.toMatch(/[A-Za-z]:[\\/].{0,80}node_modules/);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('fails the build when a leak slips past the dts rule', async () => {
        const dir = typeFestFixture();
        try {
            await expect(
                build(
                    createTsdownConfig({
                        ...fixtureConfig(dir),
                        // Reproduce the old `/node_modules/` dts externalization.
                        deps: {
                            neverBundle: [/(^node:)|\/tests\/|node_modules/],
                            dts: { neverBundle: [/node_modules/] },
                        },
                    })
                )
            ).rejects.toThrow(/Absolute node_modules path/);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('can fail from disk at closeBundle', async () => {
        const dir = typeFestFixture();
        try {
            await expect(
                build(
                    createTsdownConfig(
                        {
                            ...fixtureConfig(dir),
                            deps: {
                                neverBundle: [/(^node:)|\/tests\/|node_modules/],
                                dts: { neverBundle: [/node_modules/] },
                            },
                        },
                        undefined,
                        { nodeModulesLeakReporter: { when: 'closeBundle' } }
                    )
                )
            ).rejects.toThrow(/Absolute node_modules path/);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('merges overrides', () => {
        const config = createTsdownConfig({ format: ['cjs'], minify: false });
        expect(config.format).toEqual(['cjs']);
        expect(config.minify).toBe(false);
        expect(config.platform).toBe('node');
    });

    it('builds a branded post banner', () => {
        const banner = createPostBanner({ name: 'Acme', version: '1.2.3', license: 'MIT' });
        const out = banner({ fileName: 'index.js' });
        expect(out).toContain('Acme v1.2.3');
        expect(out).toContain('MIT');
        expect(out).toContain('index.js');
    });

    it('attaches the banner when requested', () => {
        const config = createTsdownConfig({}, { name: 'Acme' });
        expect(typeof (config.outputOptions as any)?.postBanner).toBe('function');
    });

    it('sort hook exists', () => {
        const hooks = baseTsdownConfig.hooks as any;
        expect(typeof hooks['build:done']).toBe('function');
        // ensure the hook does not throw on a minimal ctx
        expect(() => hooks['build:done']({ options: {} })).not.toThrow();
    });

    it('vi is available for future spies', () => {
        expect(vi.isMockFunction(vi.fn())).toBe(true);
    });
});

describe('node_modules leak reporter', () => {
    const chunk = (fileName: string, code: string) => ({ type: 'chunk', fileName, code });
    const leak = 'import type { X } from "C:/work/node_modules/pkg/index.d.ts";';
    type Hook = 'generateBundle' | 'writeBundle' | 'closeBundle';

    function run(
        plugin: ReturnType<typeof createNodeModulesLeakReporter>,
        bundle: Record<string, unknown>,
        options: { hook?: Hook; loggerLevel?: string } = {}
    ): { errors: string[]; logger: Record<string, ReturnType<typeof vi.fn> | string> } {
        const { hook = 'writeBundle', loggerLevel = 'info' } = options;
        const errors: string[] = [];
        const logger = { level: loggerLevel, info: vi.fn(), warn: vi.fn() };
        plugin.tsdownConfigResolved?.({ logger, cwd: process.cwd(), outDir: 'dist' } as never);
        const context = { error: (message: string) => errors.push(message) };
        const hookFn = plugin[hook] as unknown as (
            this: typeof context,
            ...args: unknown[]
        ) => void;
        if (hook === 'closeBundle') hookFn.call(context);
        else if (hook === 'generateBundle') hookFn.call(context, {}, bundle);
        else hookFn.call(context, { dir: 'dist' }, bundle);
        return { errors, logger };
    }

    it('formats and caps the report', () => {
        const leaks = Array.from({ length: 12 }, (_, index) => ({
            file: `f${index}.d.ts`,
            specifier: `C:/x/node_modules/p${index}/index.js`,
        }));
        const message = formatNodeModulesLeakMessage(leaks);
        expect(message).toContain('Absolute node_modules path');
        expect(message).toContain('f0.d.ts');
        expect(message).toContain('... and 2 more');
    });

    it('fails on an absolute node_modules specifier by default', () => {
        const { errors } = run(createNodeModulesLeakReporter(), {
            'index.d.ts': chunk('index.d.ts', leak),
        });
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('Absolute node_modules path');
    });

    it('ignores bare and relative specifiers', () => {
        const { errors } = run(createNodeModulesLeakReporter(), {
            'index.js': chunk(
                'index.js',
                [
                    'import a from "type-fest";',
                    'import b from "./node_modules/pkg/index.js";',
                    'const c = "C:/project/src/index.ts";',
                    'const d = "./node_modules/pkg/index.js";',
                    'const route = "/api/node_modules/foo";',
                ].join('\n')
            ),
        });
        expect(errors).toHaveLength(0);
    });

    it('detects absolute paths outside import statements too', () => {
        const { errors } = run(createNodeModulesLeakReporter(), {
            'index.js': chunk('index.js', 'const cache = "C:/work/node_modules/pkg/cache";'),
        });
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('node_modules');
    });

    it('honours ignore patterns', () => {
        const { errors } = run(createNodeModulesLeakReporter({ ignore: [/allowed/] }), {
            'index.js': chunk('index.js', 'import x from "C:/x/node_modules/allowed/index.js";'),
        });
        expect(errors).toHaveLength(0);
    });

    it('warns and logs info only when the resolved log level allows it', () => {
        const bundle = { 'index.d.ts': chunk('index.d.ts', leak) };

        const warned = run(createNodeModulesLeakReporter({ level: 'warn' }), bundle, {
            loggerLevel: 'info',
        });
        expect(warned.errors).toHaveLength(0);
        expect(warned.logger.warn).toHaveBeenCalledTimes(1);

        const hiddenInfo = run(createNodeModulesLeakReporter({ level: 'info' }), bundle, {
            loggerLevel: 'warn',
        });
        expect(hiddenInfo.logger.info).not.toHaveBeenCalled();

        const shownInfo = run(createNodeModulesLeakReporter({ level: 'info' }), bundle, {
            loggerLevel: 'info',
        });
        expect(shownInfo.logger.info).toHaveBeenCalledTimes(1);
    });

    it('can be silenced', () => {
        const { errors, logger } = run(createNodeModulesLeakReporter({ level: 'silent' }), {
            'index.d.ts': chunk('index.d.ts', leak),
        });
        expect(errors).toHaveLength(0);
        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });

    it('supports an early generateBundle analysis', () => {
        const plugin = createNodeModulesLeakReporter({ when: 'generateBundle' });
        const bundle = { 'index.d.ts': chunk('index.d.ts', leak) };

        expect(run(plugin, bundle, { hook: 'generateBundle' }).errors).toHaveLength(1);
        expect(run(plugin, bundle, { hook: 'writeBundle' }).errors).toHaveLength(0);
    });

    it('can analyze files from disk at closeBundle', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tsdown-close-'));
        const out = path.join(dir, 'dist');
        fs.mkdirSync(out, { recursive: true });
        fs.writeFileSync(path.join(out, 'index.d.ts'), leak);
        try {
            const plugin = createNodeModulesLeakReporter({ when: 'closeBundle' });
            plugin.tsdownConfigResolved?.({
                logger: { level: 'info', info: vi.fn(), warn: vi.fn() },
                cwd: dir,
                outDir: 'dist',
            } as never);
            const errors: string[] = [];
            const context = { error: (message: string) => errors.push(message) };
            (plugin.writeBundle as unknown as (...args: unknown[]) => void).call(
                context,
                { dir: out },
                {}
            );
            expect(errors).toHaveLength(0);
            (plugin.closeBundle as unknown as (this: typeof context) => void).call(context);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('Absolute node_modules path');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('is included and configurable through createTsdownConfig', () => {
        const plugins = (createTsdownConfig().plugins ?? []) as { name?: string }[];
        expect(plugins.some(plugin => plugin.name === NODE_MODULES_LEAK_REPORTER)).toBe(true);

        const disabled = (createTsdownConfig({}, undefined, { nodeModulesLeakReporter: false })
            .plugins ?? []) as { name?: string }[];
        expect(disabled.some(plugin => plugin.name === NODE_MODULES_LEAK_REPORTER)).toBe(false);

        const configured = (createTsdownConfig({}, undefined, {
            nodeModulesLeakReporter: { level: 'warn' },
        }).plugins ?? []) as { name?: string }[];
        expect(
            configured.filter(plugin => plugin.name === NODE_MODULES_LEAK_REPORTER)
        ).toHaveLength(1);
    });
});

describe('sortPackageExports', () => {
    it('writes the sorted exports back to package.json', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tsdown-'));
        const file = path.join(dir, 'package.json');
        fs.writeFileSync(
            file,
            JSON.stringify({
                name: 'x',
                exports: {
                    './package.json': './package.json',
                    './z': './dist/z.js',
                    '.': './dist/index.js',
                    './types': './dist/index.d.ts',
                    './a': './dist/a.js',
                },
            })
        );
        try {
            expect(sortPackageExports(file)).toBe(true);
            const pkg = JSON.parse(fs.readFileSync(file, 'utf8')) as {
                exports: Record<string, string>;
            };
            expect(Object.keys(pkg.exports)).toEqual([
                '.',
                './types',
                './a',
                './z',
                './package.json',
            ]);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
