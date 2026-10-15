import { defineConfig } from 'vite-plus';

/**
 * Vite Task definitions for this package. `build`, `typecheck` and `test` are
 * declared as tasks (package.json scripts cannot carry cache config) with
 * explicit cache input/output so `vp run` caches them. The build task excludes
 * its own dist output from the inputs; typecheck and test write nothing, so
 * their output restoration is disabled.
 */
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
