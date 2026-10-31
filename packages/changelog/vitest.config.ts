import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: { tsconfigPaths: true },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        // Tests must not call the GitHub API (credits are best-effort).
        env: { DBX_NO_GH: '1' },
    },
});
