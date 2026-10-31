import type { ViteUserConfig } from 'vite-plus';

import { DEFAULT_IGNORE_PATTERNS } from './ignore.js';

/** The Oxfmt options accepted by Vite+ (`toolchain.vite.fmt`). */
export type ToolchainOxfmtConfig = NonNullable<ViteUserConfig['fmt']>;

/** The Oxlint options accepted by Vite+ (`toolchain.vite.lint`). */
export type ToolchainOxlintConfig = NonNullable<ViteUserConfig['lint']>;

/**
 * Common paths Oxfmt should leave alone. Starts from the shared build/cache
 * ignores and adds generated JSON/YAML, lockfiles, changelogs and the managed
 * `vite.config.ts` shim.
 */
export const DEFAULT_FMT_IGNORE_PATTERNS: string[] = [
    ...DEFAULT_IGNORE_PATTERNS,
    '**/.nuxt/**',
    '**/.svelte-kit/**',
    '**/.generated/**',
    '**/generated/**',
    '**/*.json',
    '**/*.yml',
    '**/*.yaml',
    '**/*.lock',
    '**/*.min.*',
    '**/CHANGELOG.md',
    'CHANGELOG.proposed.md',
    '**/vite.config.ts',
];

/**
 * The Oxfmt options used when `vite.fmt` is `true`, and the base an options
 * object is merged over. `sortImports` is intentionally left out: import order
 * is project-specific, so consumers opt in with their own groups.
 */
export const DEFAULT_FMT_RULES: ToolchainOxfmtConfig = {
    useTabs: false,
    tabWidth: 4,
    printWidth: 100,
    endOfLine: 'lf',
    insertFinalNewline: true,
    singleQuote: true,
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    trailingComma: 'es5',
    semi: true,
    arrowParens: 'avoid',
    bracketSpacing: true,
    bracketSameLine: false,
    singleAttributePerLine: false,
    objectWrap: 'preserve',
    proseWrap: 'preserve',
    embeddedLanguageFormatting: 'auto',
    htmlWhitespaceSensitivity: 'css',
    vueIndentScriptAndStyle: false,
    sortPackageJson: false,
    ignorePatterns: DEFAULT_FMT_IGNORE_PATTERNS,
};

/** Common paths Oxlint should leave alone. */
export const DEFAULT_LINT_IGNORE_PATTERNS: string[] = [
    ...DEFAULT_IGNORE_PATTERNS,
    '**/.nuxt/**',
    '**/.svelte-kit/**',
    '**/.generated/**',
    '**/generated/**',
    '**/*.min.*',
    '**/vendor/**',
];

/**
 * The Oxlint options used when `vite.lint` is `true`, and the base an options
 * object is merged over. Framework/a11y rules are disabled by default (opt in
 * per project); the remaining rules are non-blocking warnings.
 */
export const DEFAULT_LINT_RULES: ToolchainOxlintConfig = {
    ignorePatterns: DEFAULT_LINT_IGNORE_PATTERNS,
    rules: {
        'jsx-a11y/alt-text': 'off',
        'jsx-a11y/aria-props': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'react/button-has-type': 'off',
        'react/react-in-jsx-scope': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'typescript/no-empty-object-type': 'off',
        'typescript/no-explicit-any': 'off',
        'typescript/no-non-null-assertion': 'off',
        'typescript/no-useless-empty-export': 'off',
        eqeqeq: 'warn',
        'import/no-duplicates': 'warn',
        'no-alert': 'warn',
        'no-case-declarations': 'off',
        'no-console': 'off',
        'no-constant-condition': 'off',
        'no-control-regex': 'off',
        'no-debugger': 'warn',
        'no-inner-declarations': 'off',
        'no-return-assign': 'off',
        'no-unused-vars': 'warn',
        'no-useless-escape': 'off',
        'no-var': 'warn',
        'prefer-const': 'warn',
        'prefer-exponentiation-operator': 'off',
        'prefer-template': 'off',
    },
};
