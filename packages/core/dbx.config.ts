import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        vite: {
            fmt: { ignorePatterns: ['/vite.config.ts'] },
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
                    'typecheck:ci': {
                        command: 'tsc -p tsconfig.build.json --noEmit',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },
                    test: {
                        command: 'vitest run',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },
                    lint: {
                        command: 'vp lint --fix',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                    check: {
                        command: 'vp check',
                        cache: { input: [{ auto: true }], output: [] },
                    },
                },
            },
        },
    },
});
