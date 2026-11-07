import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        // Sections are opt-in per nested config; inherit the root formatting.
        fmt: true,
        lint: true,
        vite: {
            // Static shim + tsconfig path resolution (the root `vite` section is
            // not inherited).
            shim: 'static',
            resolve: {
                tsconfigPaths: true,
            },
            run: {
                tasks: {
                    build: {
                        command: 'tsdown --config-loader unrun',
                        cache: {
                            input: [{ auto: true }, '!dist/**', '!**/*.tsbuildinfo'],
                            output: ['dist/**'],
                        },
                    },
                    typecheck: {
                        command: 'tsc -p tsconfig.json --noEmit',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },

                    test: {
                        command: 'vitest run',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },
                    format: {
                        command: 'vp fmt',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    'format:check': {
                        command: 'vp fmt --check',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    lint: {
                        command: 'vp lint --fix',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    'lint:check': {
                        command: 'vp lint',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    check: {
                        command: 'vp check',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    'check:fix': {
                        command: 'vp check --fix',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                },
            },
        },
    },
});
