import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.integration.js',
    version: 'stable',
    workspaceFolder: './test-fixtures/workspace',
    extensionDevelopmentPath: '.',
    // Keep the test host isolated from locally installed extensions and trust
    // prompts so runs are deterministic.
    launchArgs: ['--disable-extensions', '--disable-workspace-trust'],
    mocha: {
        ui: 'tdd',
        timeout: 20000,
        color: true,
    },
});
