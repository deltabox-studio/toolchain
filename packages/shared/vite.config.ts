import { defineConfig } from 'vite-plus';

export default defineConfig({
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
                command: 'tsc -p tsconfig.build.json --noEmit',
                cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
            },
            test: {
                command: 'vitest run',
                cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
            },
        },
    },
});
