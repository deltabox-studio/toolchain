import { defineConfig } from 'vite-plus';

/**
 * Vite+ configuration for `@deltabox/toolchain` (self-migration).
 *
 * One file drives the whole toolchain: Vitest (`test`), Oxlint (`lint`), Oxfmt
 * (`fmt`) and the monorepo task runner (`run`, Vite Task). The `fmt`/`lint`
 * values were produced by `dbx migrate --from biome` (Biome formatter
 * + organizeImports -> Oxfmt `sortImports`, and the Biome linter rules).
 */
export default defineConfig({
    // Vitest: every package's tests + the root CLI tests.
    test: {
        include: ['packages/**/tests/**/*.test.ts', 'tests/**/*.test.ts'],
        environment: 'node',
        exclude: ['**/node_modules/**', '**/dist/**'],
    },

    // Oxfmt (from `biome.json` formatter + javascript.formatter).
    fmt: {
        useTabs: false,
        tabWidth: 4,
        printWidth: 100,
        endOfLine: 'lf',
        singleQuote: true,
        jsxSingleQuote: false,
        quoteProps: 'as-needed',
        trailingComma: 'es5',
        semi: true,
        arrowParens: 'avoid',
        bracketSpacing: true,
        bracketSameLine: false,
        ignorePatterns: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.turbo/**',
            '**/.generated/**',
            '*.json',
            'packages/*/*.json',
            '**/tsconfig*.json',
            'biome.json',
            '**/*.yml',
            '**/*.yaml',
            // The changelog pipeline owns its own markdown format.
            '**/CHANGELOG.md',
            'CHANGELOG.proposed.md',
        ],
        // Biome `assist.actions.source.organizeImports.groups`.
        sortImports: {
            groups: [
                'builtin',
                'external',
                ['custom0', 'internal'],
                ['custom1', 'custom2'],
                ['parent', 'sibling', 'index'],
            ],
            internalPattern: ['~/', '@/'],
            newlinesBetween: true,
            sortPackageJson: false,
            customGroups: [
                { groupName: 'custom0', elementNamePattern: ['deltabox', '@deltabox/**'] },
                { groupName: 'custom1', elementNamePattern: ['lucide*'] },
                { groupName: 'custom2', elementNamePattern: ['iconify*'] },
            ],
        },
    },

    // Oxlint (from `biome.json` linter.rules; `info` -> `off`, no Oxlint level).
    lint: {
        ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/.turbo/**', '**/.generated/**'],
        rules: {
            'jsx-a11y/alt-text': 'off',
            'react/button-has-type': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
            'typescript/no-empty-object-type': 'off',
            'no-useless-escape': 'off',
            'typescript/no-useless-empty-export': 'off',
            'no-constant-condition': 'off',
            'no-inner-declarations': 'off',
            'no-unused-vars': 'warn',
            'no-case-declarations': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'prefer-exponentiation-operator': 'off',
            'typescript/no-non-null-assertion': 'off',
            'prefer-template': 'off',
            'no-return-assign': 'off',
            eqeqeq: 'warn',
            'typescript/no-explicit-any': 'off',
        },
    },

    // Vite Task (`vp run`) replaces turbo. Each package declares its own
    // build/typecheck/test tasks (with cache input/output) in its vite.config.ts;
    // here we define the workspace-root umbrella tasks.
    run: {
        tasks: {
            'build:root': {
                command: 'tsdown --config-loader unrun',
                cache: {
                    input: [{ auto: true }, '!dist/**', '!**/*.tsbuildinfo'],
                    output: ['dist/**'],
                },
            },
            'typecheck:root': {
                command: 'tsc -p tsconfig.build.json --noEmit',
                cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
            },
            'test:root': {
                command: 'vitest run',
                cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
            },
        },
    },
});
