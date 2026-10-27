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
                    test: {
                        command: 'vitest run',
                        cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
                    },
                },
            },
        },
    },
});
