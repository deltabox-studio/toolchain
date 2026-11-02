// Generated from Oxlint's configuration_schema.json — do not edit.
// Run `yarn config:generate` to refresh.

export interface OxlintConfig {
    /**
     * Configure an entire category of rules all at once.
     *
     * Rules enabled or disabled this way will be overwritten by individual rules in the `rules` field.
     *
     * Example
     *
     * ```json
     * {
     *     "$schema": "./node_modules/oxlint/configuration_schema.json",
     *     "categories": {
     *         "correctness": "warn"
     *     },
     *     "rules": {
     *         "eslint/no-unused-vars": "error"
     *     }
     * }
     * ```
     */
    categories?: {
        correctness?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number;
        nursery?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number;
        pedantic?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number;
        perf?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number;
        restriction?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number;
        style?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number;
        suspicious?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number;
    };
    /**
     * Environments enable and disable collections of global variables.
     *
     * @allowExtraKeys true
     */
    env?: any;
    /**
     * Configurations that this configuration file extends (inherits from).
     *
     * In `.oxlintrc.json`, `extends` has type `string[]`. Each string is a path to a configuration file, resolved relative to the location of the configuration file that contains the `extends` property.
     *
     * In `oxlint.config.ts`, `extends` has type `OxlintConfig[]`. Import each configuration and pass the configuration object directly:
     *
     * ```ts
     * import { defineConfig } from 'oxlint';
     * import baseConfig from './base-config.ts';
     *
     * export default defineConfig({ extends: [baseConfig] });
     * ```
     *
     * Configurations are merged from the first to the last, with the last configuration overriding the previous ones.
     */
    extends?: Array<string>;
    /**
     * Enabled or disabled specific global variables.
     *
     * @allowExtraKeys true
     */
    globals?: any;
    /** Globs to ignore during linting. Patterns use gitignore-style matching, rooted at the directory containing the configuration file. Files outside that directory cannot be matched; patterns containing `..` are rejected as a configuration error. */
    ignorePatterns?: Array<string>;
    /**
     * JS plugins, allows usage of ESLint plugins with Oxlint.
     *
     * Read more about JS plugins in [the docs](https://oxc.rs/docs/guide/usage/linter/js-plugins.html).
     *
     * Note: JS plugins are in alpha and not subject to semver.
     *
     * Examples:
     *
     * Basic usage with a local plugin path.
     *
     * ```json
     * {
     *     "jsPlugins": ["./custom-plugin.js"],
     *     "rules": {
     *         "custom/rule-name": "warn"
     *     }
     * }
     * ```
     *
     * Basic usage with a TypeScript plugin and a local plugin path.
     *
     * TypeScript plugin files are supported in the following environments:
     *
     * - Deno and Bun: TypeScript files are supported natively.
     * - Node.js >=22.18.0 and Node.js ^20.19.0: TypeScript files are supported natively with built-in type-stripping enabled by default.
     *
     * For older Node.js versions, TypeScript plugins are not supported. Please use JavaScript plugins or upgrade your Node version.
     *
     * ```json
     * {
     *     "jsPlugins": ["./custom-plugin.ts"],
     *     "rules": {
     *         "custom/rule-name": "warn"
     *     }
     * }
     * ```
     *
     * Using a built-in Rust plugin alongside a JS plugin with the same name by giving the JS plugin an alias.
     *
     * ```json
     * {
     *     "plugins": ["import"],
     *     "jsPlugins": [{ "name": "import-js", "specifier": "eslint-plugin-import" }],
     *     "rules": {
     *         "import/no-cycle": "error",
     *         "import-js/no-unresolved": "warn"
     *     }
     * }
     * ```
     */
    jsPlugins?: null | Array<string | { name: string; specifier: string }>;
    /** Oxlint config options. */
    options?: {
        /**
         * Ensure warnings produce a non-zero exit code.
         *
         * Equivalent to passing `--deny-warnings` on the CLI.
         */
        denyWarnings?: boolean;
        /**
         * Specify a warning threshold. Exits with an error status if warnings exceed this value.
         *
         * Equivalent to passing `--max-warnings` on the CLI.
         */
        maxWarnings?: number;
        /**
         * Report unused disable directives (e.g. `// oxlint-disable-line` or `// eslint-disable-line`).
         *
         * Equivalent to passing `--report-unused-disable-directives-severity` on the CLI. CLI flags take precedence over this value when both are set. Only supported in the root configuration file.
         */
        reportUnusedDisableDirectives?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number;
        /**
         * Whether oxlint should respect `eslint-disable*` and `eslint-enable*` directives in addition to its native `oxlint-*` directives.
         *
         * Defaults to `true`. Only supported in the root configuration file.
         */
        respectEslintDisableDirectives?: boolean;
        /**
         * Enable rules that require type information.
         *
         * Equivalent to passing `--type-aware` on the CLI.
         *
         * Note that this requires the `oxlint-tsgolint` package to be installed.
         */
        typeAware?: boolean;
        /**
         * Enable experimental type checking (includes TypeScript compiler diagnostics).
         *
         * Equivalent to passing `--type-check` on the CLI.
         *
         * Note that this requires the `oxlint-tsgolint` package to be installed.
         */
        typeCheck?: boolean;
    };
    /** Add, remove, or otherwise reconfigure rules for specific files or groups of files. */
    overrides?: Array<{
        env?: {};
        excludeFiles?: Array<string>;
        files: Array<string>;
        globals?: {};
        jsPlugins?: null | Array<string | { name: string; specifier: string }>;
        plugins?: Array<'eslint' | 'react' | 'unicorn' | 'typescript' | 'oxc' | 'import' | 'jsdoc' | 'jest' | 'vitest' | 'jsx-a11y' | 'nextjs' | 'react-perf' | 'promise' | 'node' | 'vue'>;
        rules?: {
            'accessor-pairs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'array-callback-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'arrow-body-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'block-scoped-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'capitalized-comments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'class-methods-use-this'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            complexity?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'constructor-super'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            curly?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'default-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'default-case-last'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'default-param-last'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            eqeqeq?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'for-direction'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'func-name-matching'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown> | Array<unknown> | Array<unknown>;
            'func-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'func-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'getter-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'grouped-accessor-pairs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'guard-for-in'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'id-denylist'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<string>;
            'id-length'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'id-match'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/consistent-type-specifier-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/default'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/exports-last'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/extensions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown> | Array<unknown> | Array<unknown>;
            'import/first'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/group-exports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/max-dependencies'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/named'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/namespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/newline-after-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-absolute-path'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-amd'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-anonymous-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-commonjs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-cycle'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-duplicates'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-dynamic-require'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-empty-named-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-mutable-exports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-named-as-default'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-named-as-default-member'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-named-default'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-named-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-namespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-nodejs-modules'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-relative-parent-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-self-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/no-unassigned-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/no-webpack-loader-syntax'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'import/prefer-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'import/unambiguous'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'init-declarations'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/consistent-test-it'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/expect-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/max-expects'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/max-nested-describe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/no-alias-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-commented-out-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-conditional-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-conditional-in-test'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-confusing-set-timeout'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-deprecated-functions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/no-disabled-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-done-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-duplicate-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-focused-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/no-identical-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-interpolation-in-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-jasmine-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-large-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/no-mocks-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-restricted-jest-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/no-restricted-matchers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/no-standalone-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/no-test-prefixes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-test-return-statement'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-unneeded-async-expect-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/no-untyped-mock-factory'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/padding-around-after-all-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/padding-around-test-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-called-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-comparison-matcher'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-each'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-ending-with-an-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/prefer-equality-matcher'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-expect-assertions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/prefer-expect-resolves'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-hooks-in-order'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-hooks-on-top'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-importing-jest-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/prefer-jest-mocked'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-lowercase-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/prefer-mock-promise-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-mock-return-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-snapshot-hint'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/prefer-spy-on'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-strict-equal'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-to-be'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-to-contain'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-to-have-been-called'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-to-have-been-called-times'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-to-have-length'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/prefer-todo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/require-hook'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/require-to-throw-message'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/require-top-level-describe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/valid-describe-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/valid-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jest/valid-expect-in-promise'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jest/valid-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/check-access'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/check-property-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/check-tag-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/empty-tags'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/implements-on-classes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/no-blank-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/no-defaults'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/require-param'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/require-param-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/require-param-name'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-param-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/require-property'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-property-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-property-name'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-property-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-returns'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/require-returns-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-returns-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-throws-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-throws-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-yields'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsdoc/require-yields-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsdoc/require-yields-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/alt-text'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/anchor-ambiguous-text'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/anchor-has-content'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/anchor-is-valid'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/aria-activedescendant-has-tabindex'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/aria-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/aria-proptypes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/aria-role'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/aria-unsupported-elements'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/autocomplete-valid'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/click-events-have-key-events'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/control-has-associated-label'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/heading-has-content'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/html-has-lang'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/iframe-has-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/img-redundant-alt'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/interactive-supports-focus'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/label-has-associated-control'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/lang'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/media-has-caption'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/mouse-events-have-key-events'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/no-access-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/no-aria-hidden-on-focusable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/no-autofocus'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/no-distracting-elements'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/no-interactive-element-to-noninteractive-role'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/no-noninteractive-element-interactions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/no-noninteractive-element-to-interactive-role'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/no-noninteractive-tabindex'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/no-redundant-roles'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/no-static-element-interactions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'jsx-a11y/prefer-tag-over-role'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/role-has-required-aria-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/role-supports-aria-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/scope'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'jsx-a11y/tabindex-no-positive'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'logical-assignment-operators'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'max-classes-per-file'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'max-depth'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'max-lines'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'max-lines-per-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'max-nested-callbacks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'max-params'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'max-statements'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'new-cap'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'nextjs/google-font-display'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/google-font-preconnect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/inline-script-id'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/next-script-for-ga'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-assign-module-variable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-async-client-component'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-before-interactive-script-outside-document'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-css-tags'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-document-import-in-page'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-duplicate-head'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-head-element'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-head-import-in-document'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-html-link-for-pages'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-img-element'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-page-custom-font'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-script-component-in-head'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-styled-jsx-in-document'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-sync-scripts'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-title-in-document-head'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-typos'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'nextjs/no-unwanted-polyfillio'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-alert'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-array-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-async-promise-executor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-await-in-loop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-bitwise'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-caller'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-case-declarations'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-class-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-compare-neg-zero'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-cond-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-console'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-const-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-constant-binary-expression'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-constant-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-constructor-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-continue'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-control-regex'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-debugger'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-delete-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-div-regex'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-dupe-class-members'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-dupe-else-if'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-dupe-keys'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-duplicate-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-duplicate-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-else-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-empty'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-empty-character-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-empty-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-empty-pattern'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-empty-static-block'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-eq-null'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-eval'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-ex-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-extend-native'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-extra-bind'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-extra-boolean-cast'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-extra-label'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-fallthrough'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-func-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-global-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-implicit-coercion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-implicit-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-implied-eval'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-import-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-inline-comments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-inner-declarations'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-invalid-regexp'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-irregular-whitespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-iterator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-label-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-labels'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-lone-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-lonely-if'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-loop-func'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-loss-of-precision'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-magic-numbers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-misleading-character-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-multi-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-multi-str'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-negated-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-nested-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-new'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-new-func'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-new-native-nonconstructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-new-wrappers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-nonoctal-decimal-escape'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-obj-calls'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-object-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-param-reassign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-plusplus'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-promise-executor-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-proto'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-prototype-builtins'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-redeclare'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-regex-spaces'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-restricted-exports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-restricted-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | unknown;
            'no-restricted-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | unknown;
            'no-restricted-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | unknown;
            'no-return-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-script-url'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-self-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-self-compare'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-sequences'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-setter-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-shadow'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-shadow-restricted-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-sparse-arrays'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-template-curly-in-string'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-this-before-super'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-throw-literal'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-unassigned-vars'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-undef'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-undefined'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-underscore-dangle'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-unexpected-multiline'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-unmodified-loop-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-unneeded-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-unreachable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-unreachable-loop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-unsafe-finally'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-unsafe-negation'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-unsafe-optional-chaining'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-unused-expressions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-unused-labels'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-unused-private-class-members'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-unused-vars'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-use-before-define'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-useless-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-useless-backreference'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-useless-call'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-useless-catch'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-useless-computed-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-useless-concat'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-useless-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-useless-escape'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-useless-rename'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-useless-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'no-void'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-warning-comments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'no-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'node/callback-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'node/exports-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'node/global-require'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'node/handle-callback-err'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'node/no-exports-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'node/no-mixed-requires'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'node/no-new-require'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'node/no-path-concat'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'node/no-process-env'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'node/no-sync'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'node/no-top-level-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'object-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'one-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'operator-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'oxc/approx-constant'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/bad-array-method-on-arguments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/bad-bitwise-operator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/bad-char-at-comparison'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/bad-comparison-sequence'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/bad-match-all-arg'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/bad-min-max-func'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/bad-object-literal-comparison'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/bad-replace-all-arg'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/branches-sharing-code'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/const-comparisons'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/double-comparisons'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/erasing-op'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/misrefactored-assign-op'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/missing-throw'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/no-accumulating-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/no-async-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/no-async-endpoint-handlers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'oxc/no-barrel-file'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'oxc/no-const-enum'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/no-map-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'oxc/no-optional-chaining'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'oxc/no-rest-spread-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'oxc/no-this-in-exported-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/number-arg-out-of-range'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/only-used-in-recursion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'oxc/uninvoked-array-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'prefer-arrow-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'prefer-const'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'prefer-destructuring'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'prefer-exponentiation-operator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'prefer-named-capture-group'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'prefer-numeric-literals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'prefer-object-has-own'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'prefer-object-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'prefer-promise-reject-errors'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'prefer-regex-literals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'prefer-rest-params'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'prefer-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'prefer-template'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'preserve-caught-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/always-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/avoid-new'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'promise/catch-or-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/no-callback-in-promise'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/no-multiple-resolved'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'promise/no-nesting'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'promise/no-new-statics'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'promise/no-promise-in-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/no-return-in-finally'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'promise/no-return-wrap'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/param-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/prefer-await-to-callbacks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'promise/prefer-await-to-then'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/prefer-catch'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'promise/spec-only'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'promise/valid-params'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            radix?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react-perf/jsx-no-jsx-as-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react-perf/jsx-no-new-array-as-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react-perf/jsx-no-new-function-as-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react-perf/jsx-no-new-object-as-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/button-has-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/capitalized-calls'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/checked-requires-onchange-or-readonly'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/display-name'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/error-boundaries'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/exhaustive-deps'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/exhaustive-effect-dependencies'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/forbid-component-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/forbid-dom-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/forbid-elements'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/forward-ref-uses-ref'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/function-component-definition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/hook-use-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/iframe-missing-sandbox'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/immutability'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/incompatible-library'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/invariant'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/jsx-boolean-value'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-curly-brace-presence'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-filename-extension'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-fragments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-handler-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-max-depth'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-no-comment-textnodes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/jsx-no-constructed-context-values'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/jsx-no-duplicate-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/jsx-no-literals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-no-script-url'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown> | Array<unknown>;
            'react/jsx-no-target-blank'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-no-undef'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/jsx-no-useless-fragment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-pascal-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/jsx-props-no-spread-multi'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/jsx-props-no-spreading'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/memo-dependencies'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-array-index-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-children-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-clone-element'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-danger'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-danger-with-children'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-deriving-state-in-effects'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-did-mount-set-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/no-did-update-set-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/no-direct-mutation-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-find-dom-node'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-is-mounted'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-multi-comp'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/no-namespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-object-type-as-default-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-react-children'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-redundant-should-component-update'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-render-return-value'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-set-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-string-refs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/no-this-in-sfc'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-unescaped-entities'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/no-unknown-property'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/no-unsafe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/no-unstable-nested-components'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/no-will-update-set-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/only-export-components'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/prefer-es6-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/prefer-function-component'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/preserve-manual-memoization'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/purity'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/react-in-jsx-scope'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/refs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/require-render-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/rule-suppression'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/rules-of-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/self-closing-comp'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/set-state-in-effect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/set-state-in-render'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/state-in-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/static-components'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/style-prop-object'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'react/syntax'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/todo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/unsupported-syntax'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/use-memo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/void-dom-elements-no-children'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'react/void-use-memo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'require-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'require-unicode-regexp'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'require-yield'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'sort-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'sort-keys'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'sort-vars'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'symbol-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/adjacent-overload-signatures'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/array-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/await-thenable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/ban-ts-comment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/ban-tslint-comment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/ban-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/class-literal-property-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/consistent-generic-constructors'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/consistent-indexed-object-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/consistent-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/consistent-type-assertions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/consistent-type-definitions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/consistent-type-exports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/consistent-type-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/dot-notation'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/explicit-function-return-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/explicit-member-accessibility'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/explicit-module-boundary-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/method-signature-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-array-delete'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-base-to-string'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-confusing-non-null-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-confusing-void-expression'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-deprecated'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-duplicate-enum-values'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-duplicate-type-constituents'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-dynamic-delete'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-empty-interface'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-empty-object-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-explicit-any'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-extra-non-null-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-extraneous-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-floating-promises'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-for-in-array'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-generated-empty-object-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-implied-eval'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-import-type-side-effects'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-inferrable-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-invalid-void-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-meaningless-void-operator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-misused-new'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-misused-promises'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-misused-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-mixed-enums'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-namespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-non-null-asserted-nullish-coalescing'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-non-null-asserted-optional-chain'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-non-null-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-redundant-type-constituents'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-require-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-restricted-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-this-alias'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-unnecessary-boolean-literal-compare'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-unnecessary-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-unnecessary-parameter-property-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unnecessary-qualifier'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unnecessary-template-expression'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unnecessary-type-arguments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unnecessary-type-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-unnecessary-type-constraint'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unnecessary-type-conversion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unnecessary-type-parameters'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-argument'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-call'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-declaration-merging'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-enum-comparison'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-function-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-member-access'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/no-unsafe-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-type-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-unsafe-unary-minus'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-useless-default-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-useless-empty-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-var-requires'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/no-wrapper-object-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/non-nullable-type-assertion-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/only-throw-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/parameter-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/prefer-as-const'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-enum-initializers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-find'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-for-of'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-function-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-includes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-literal-enum-member'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/prefer-namespace-keyword'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-nullish-coalescing'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/prefer-optional-chain'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/prefer-promise-reject-errors'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/prefer-readonly'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/prefer-readonly-parameter-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/prefer-reduce-type-parameter'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-regexp-exec'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-return-this-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/prefer-string-starts-ends-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/prefer-ts-expect-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/promise-function-async'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/related-getter-setter-pairs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/require-array-sort-compare'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/require-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'typescript/restrict-plus-operands'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/restrict-template-expressions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/return-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/strict-boolean-expressions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/strict-void-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/switch-exhaustiveness-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/triple-slash-reference'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/unbound-method'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/unified-signatures'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'typescript/use-unknown-in-catch-callback-variable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicode-bom'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/catch-error-name'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/consistent-assert'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/consistent-date-clone'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/consistent-empty-array-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/consistent-existence-index-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/consistent-function-scoping'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/consistent-template-literal-escape'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/custom-error-definition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/empty-brace-spaces'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/error-message'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/escape-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/explicit-length-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/explicit-timer-delay'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/filename-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/import-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/max-nested-calls'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/new-for-builtins'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-abusive-eslint-disable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-accessor-recursion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-anonymous-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-array-callback-reference'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-array-fill-with-reference-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-array-for-each'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-array-method-this-argument'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-array-reduce'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/no-array-reverse'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/no-array-sort'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/no-await-expression-member'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-await-in-promise-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-confusing-array-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-console-spaces'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-document-cookie'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-empty-file'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-hex-escape'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-immediate-mutation'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-instanceof-array'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-instanceof-builtins'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/no-invalid-fetch-options'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-invalid-remove-event-listener'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-length-as-slice-end'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-lonely-if'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-magic-array-flat-depth'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-negated-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-negation-in-equality-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-nested-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-new-array'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-new-buffer'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-null'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/no-object-as-default-parameter'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-process-exit'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-single-promise-in-promise-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-static-only-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-thenable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-this-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-typeof-undefined'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/no-unnecessary-array-flat-depth'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-unnecessary-array-splice-count'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-unnecessary-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-unnecessary-slice-end'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-unreadable-array-destructuring'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-unreadable-iife'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-useless-collection-argument'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-useless-error-capture-stack-trace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-useless-fallback-in-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-useless-iterator-to-array'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-useless-length-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-useless-promise-resolve-reject'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/no-useless-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-useless-switch-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/no-useless-undefined'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/no-zero-fractions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/number-literal-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/numeric-separators-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-add-event-listener'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-array-find'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-array-flat'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-array-flat-map'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-array-index-of'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-array-some'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-at'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-bigint-literals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-blob-reading-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-class-fields'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-classlist-toggle'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-code-point'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-date-now'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-default-parameters'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-dom-node-append'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-dom-node-dataset'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-dom-node-remove'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-dom-node-text-content'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-event-target'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-export-from'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-global-this'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-import-meta-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-includes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-keyboard-event-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-logical-operator-over-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-math-min-max'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-math-trunc'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-modern-dom-apis'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-modern-math-apis'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-module'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-native-coercion-functions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-negative-index'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-node-protocol'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-number-coercion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-number-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-object-from-entries'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-optional-catch-binding'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-prototype-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-query-selector'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-reflect-apply'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-regexp-test'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-response-static-json'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-set-has'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-set-size'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-single-call'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-string-raw'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-string-replace-all'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-string-slice'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-string-starts-ends-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-string-trim-start-end'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-structured-clone'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/prefer-top-level-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/prefer-type-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/relative-url-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/require-array-join-separator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/require-module-attributes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/require-module-specifiers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/require-number-to-fixed-digits-argument'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/require-post-message-target-origin'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/switch-case-braces'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/switch-case-break-position'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'unicorn/text-encoding-identifier-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'unicorn/throw-new-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'use-isnan'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'valid-typeof'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vars-on-top'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/consistent-each-for'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/consistent-test-filename'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/consistent-test-it'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/consistent-vitest-vi'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/expect-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/hoisted-apis-on-top'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/max-expects'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/max-nested-describe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/no-alias-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-commented-out-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-conditional-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-conditional-in-test'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-conditional-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-disabled-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-duplicate-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-focused-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/no-identical-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-import-node-test'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-importing-vitest-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-interpolation-in-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-large-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/no-mocks-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-restricted-matchers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/no-restricted-vi-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/no-standalone-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/no-test-prefixes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-test-return-statement'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/no-unneeded-async-expect-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/padding-around-after-all-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/padding-around-test-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-called-exactly-once-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-called-once'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-called-times'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-called-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-comparison-matcher'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-describe-function-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-each'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-equality-matcher'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-expect-assertions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/prefer-expect-resolves'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-expect-type-of'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-hooks-in-order'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-hooks-on-top'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-import-in-mock'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/prefer-importing-vitest-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-lowercase-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/prefer-mock-promise-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-mock-return-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-snapshot-hint'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/prefer-spy-on'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-strict-boolean-matchers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-strict-equal'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-to-be'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-to-be-falsy'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-to-be-object'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-to-be-truthy'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-to-contain'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-to-have-been-called-times'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-to-have-length'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/prefer-todo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/require-awaited-expect-poll'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/require-hook'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/require-local-test-context-for-concurrent-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/require-mock-type-parameters'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/require-test-timeout'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/require-to-throw-message'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/require-top-level-describe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/valid-describe-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/valid-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vitest/valid-expect-in-promise'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/valid-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vitest/warn-todo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/component-definition-name-casing'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/define-emits-declaration'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/define-props-declaration'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/define-props-destructuring'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/max-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/next-tick-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/no-arrow-functions-in-watch'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-async-in-computed-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/no-computed-properties-in-data'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-deprecated-data-object-declaration'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-deprecated-delete-set'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-deprecated-destroyed-lifecycle'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-deprecated-events-api'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-deprecated-model-definition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/no-deprecated-props-default-this'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-deprecated-vue-config-keycodes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-dupe-keys'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/no-export-in-script-setup'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-expose-after-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-import-compiler-macros'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-lifecycle-after-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-multiple-slot-args'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-required-prop-with-default'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-reserved-component-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/no-reserved-keys'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/no-reserved-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/no-shared-component-data'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-side-effects-in-computed-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-this-in-before-route-enter'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/no-watch-after-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/prefer-import-from-vue'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/prop-name-casing'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/require-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/require-default-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/require-direct-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/require-prop-type-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/require-prop-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/require-render-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/require-slots-as-functions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/require-typed-ref'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/return-in-computed-property'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
            'vue/return-in-emits-validator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/valid-define-emits'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/valid-define-options'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/valid-define-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            'vue/valid-next-tick'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
            yoda?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        };
    }>;
    /**
     * Enabled built-in plugins for Oxlint. You can view the list of available plugins on [the website](https://oxc.rs/docs/guide/usage/linter/plugins.html#supported-plugins).
     *
     * NOTE: Setting the `plugins` field will overwrite the base set of plugins. The `plugins` array should reflect all of the plugins you want to use.
     *
     * @default null
     */
    plugins?: Array<'eslint' | 'react' | 'unicorn' | 'typescript' | 'oxc' | 'import' | 'jsdoc' | 'jest' | 'vitest' | 'jsx-a11y' | 'nextjs' | 'react-perf' | 'promise' | 'node' | 'vue'>;
    /**
     * Example
     *
     * `.oxlintrc.json`
     *
     * ```json
     * {
     *     "$schema": "./node_modules/oxlint/configuration_schema.json",
     *     "rules": {
     *         "eqeqeq": "warn",
     *         "import/no-cycle": "error",
     *         "prefer-const": ["error", { "ignoreReadBeforeAssign": true }]
     *     }
     * }
     * ```
     *
     * See [Oxlint Rules](https://oxc.rs/docs/guide/usage/linter/rules.html) for the list of rules.
     *
     * @allowExtraKeys true
     */
    rules?: {
        'accessor-pairs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'array-callback-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'arrow-body-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'block-scoped-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'capitalized-comments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'class-methods-use-this'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        complexity?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'constructor-super'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        curly?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'default-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'default-case-last'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'default-param-last'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        eqeqeq?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'for-direction'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'func-name-matching'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown> | Array<unknown> | Array<unknown>;
        'func-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'func-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'getter-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'grouped-accessor-pairs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'guard-for-in'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'id-denylist'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<string>;
        'id-length'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'id-match'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/consistent-type-specifier-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/default'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/exports-last'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/extensions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown> | Array<unknown> | Array<unknown>;
        'import/first'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/group-exports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/max-dependencies'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/named'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/namespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/newline-after-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-absolute-path'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-amd'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-anonymous-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-commonjs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-cycle'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-duplicates'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-dynamic-require'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-empty-named-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-mutable-exports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-named-as-default'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-named-as-default-member'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-named-default'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-named-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-namespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-nodejs-modules'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-relative-parent-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-self-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/no-unassigned-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/no-webpack-loader-syntax'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'import/prefer-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'import/unambiguous'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'init-declarations'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/consistent-test-it'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/expect-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/max-expects'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/max-nested-describe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/no-alias-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-commented-out-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-conditional-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-conditional-in-test'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-confusing-set-timeout'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-deprecated-functions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/no-disabled-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-done-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-duplicate-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-focused-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/no-identical-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-interpolation-in-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-jasmine-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-large-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/no-mocks-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-restricted-jest-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/no-restricted-matchers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/no-standalone-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/no-test-prefixes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-test-return-statement'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-unneeded-async-expect-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/no-untyped-mock-factory'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/padding-around-after-all-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/padding-around-test-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-called-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-comparison-matcher'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-each'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-ending-with-an-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/prefer-equality-matcher'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-expect-assertions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/prefer-expect-resolves'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-hooks-in-order'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-hooks-on-top'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-importing-jest-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/prefer-jest-mocked'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-lowercase-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/prefer-mock-promise-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-mock-return-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-snapshot-hint'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/prefer-spy-on'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-strict-equal'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-to-be'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-to-contain'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-to-have-been-called'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-to-have-been-called-times'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-to-have-length'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/prefer-todo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/require-hook'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/require-to-throw-message'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/require-top-level-describe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/valid-describe-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/valid-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jest/valid-expect-in-promise'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jest/valid-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/check-access'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/check-property-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/check-tag-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/empty-tags'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/implements-on-classes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/no-blank-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/no-defaults'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/require-param'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/require-param-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/require-param-name'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-param-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/require-property'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-property-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-property-name'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-property-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-returns'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/require-returns-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-returns-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-throws-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-throws-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-yields'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsdoc/require-yields-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsdoc/require-yields-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/alt-text'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/anchor-ambiguous-text'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/anchor-has-content'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/anchor-is-valid'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/aria-activedescendant-has-tabindex'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/aria-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/aria-proptypes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/aria-role'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/aria-unsupported-elements'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/autocomplete-valid'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/click-events-have-key-events'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/control-has-associated-label'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/heading-has-content'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/html-has-lang'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/iframe-has-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/img-redundant-alt'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/interactive-supports-focus'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/label-has-associated-control'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/lang'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/media-has-caption'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/mouse-events-have-key-events'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/no-access-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/no-aria-hidden-on-focusable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/no-autofocus'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/no-distracting-elements'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/no-interactive-element-to-noninteractive-role'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/no-noninteractive-element-interactions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/no-noninteractive-element-to-interactive-role'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/no-noninteractive-tabindex'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/no-redundant-roles'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/no-static-element-interactions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'jsx-a11y/prefer-tag-over-role'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/role-has-required-aria-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/role-supports-aria-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/scope'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'jsx-a11y/tabindex-no-positive'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'logical-assignment-operators'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'max-classes-per-file'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'max-depth'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'max-lines'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'max-lines-per-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'max-nested-callbacks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'max-params'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'max-statements'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'new-cap'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'nextjs/google-font-display'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/google-font-preconnect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/inline-script-id'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/next-script-for-ga'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-assign-module-variable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-async-client-component'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-before-interactive-script-outside-document'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-css-tags'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-document-import-in-page'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-duplicate-head'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-head-element'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-head-import-in-document'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-html-link-for-pages'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-img-element'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-page-custom-font'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-script-component-in-head'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-styled-jsx-in-document'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-sync-scripts'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-title-in-document-head'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-typos'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'nextjs/no-unwanted-polyfillio'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-alert'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-array-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-async-promise-executor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-await-in-loop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-bitwise'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-caller'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-case-declarations'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-class-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-compare-neg-zero'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-cond-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-console'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-const-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-constant-binary-expression'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-constant-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-constructor-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-continue'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-control-regex'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-debugger'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-delete-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-div-regex'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-dupe-class-members'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-dupe-else-if'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-dupe-keys'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-duplicate-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-duplicate-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-else-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-empty'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-empty-character-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-empty-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-empty-pattern'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-empty-static-block'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-eq-null'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-eval'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-ex-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-extend-native'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-extra-bind'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-extra-boolean-cast'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-extra-label'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-fallthrough'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-func-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-global-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-implicit-coercion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-implicit-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-implied-eval'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-import-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-inline-comments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-inner-declarations'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-invalid-regexp'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-irregular-whitespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-iterator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-label-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-labels'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-lone-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-lonely-if'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-loop-func'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-loss-of-precision'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-magic-numbers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-misleading-character-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-multi-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-multi-str'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-negated-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-nested-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-new'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-new-func'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-new-native-nonconstructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-new-wrappers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-nonoctal-decimal-escape'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-obj-calls'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-object-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-param-reassign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-plusplus'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-promise-executor-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-proto'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-prototype-builtins'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-redeclare'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-regex-spaces'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-restricted-exports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-restricted-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | unknown;
        'no-restricted-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | unknown;
        'no-restricted-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | unknown;
        'no-return-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-script-url'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-self-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-self-compare'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-sequences'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-setter-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-shadow'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-shadow-restricted-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-sparse-arrays'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-template-curly-in-string'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-this-before-super'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-throw-literal'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-unassigned-vars'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-undef'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-undefined'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-underscore-dangle'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-unexpected-multiline'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-unmodified-loop-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-unneeded-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-unreachable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-unreachable-loop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-unsafe-finally'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-unsafe-negation'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-unsafe-optional-chaining'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-unused-expressions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-unused-labels'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-unused-private-class-members'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-unused-vars'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-use-before-define'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-useless-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-useless-backreference'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-useless-call'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-useless-catch'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-useless-computed-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-useless-concat'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-useless-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-useless-escape'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-useless-rename'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-useless-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'no-void'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-warning-comments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'no-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'node/callback-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'node/exports-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'node/global-require'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'node/handle-callback-err'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'node/no-exports-assign'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'node/no-mixed-requires'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'node/no-new-require'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'node/no-path-concat'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'node/no-process-env'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'node/no-sync'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'node/no-top-level-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'object-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'one-var'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'operator-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'oxc/approx-constant'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/bad-array-method-on-arguments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/bad-bitwise-operator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/bad-char-at-comparison'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/bad-comparison-sequence'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/bad-match-all-arg'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/bad-min-max-func'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/bad-object-literal-comparison'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/bad-replace-all-arg'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/branches-sharing-code'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/const-comparisons'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/double-comparisons'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/erasing-op'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/misrefactored-assign-op'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/missing-throw'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/no-accumulating-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/no-async-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/no-async-endpoint-handlers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'oxc/no-barrel-file'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'oxc/no-const-enum'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/no-map-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'oxc/no-optional-chaining'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'oxc/no-rest-spread-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'oxc/no-this-in-exported-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/number-arg-out-of-range'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/only-used-in-recursion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'oxc/uninvoked-array-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'prefer-arrow-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'prefer-const'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'prefer-destructuring'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'prefer-exponentiation-operator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'prefer-named-capture-group'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'prefer-numeric-literals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'prefer-object-has-own'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'prefer-object-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'prefer-promise-reject-errors'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'prefer-regex-literals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'prefer-rest-params'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'prefer-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'prefer-template'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'preserve-caught-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/always-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/avoid-new'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'promise/catch-or-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/no-callback-in-promise'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/no-multiple-resolved'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'promise/no-nesting'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'promise/no-new-statics'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'promise/no-promise-in-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/no-return-in-finally'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'promise/no-return-wrap'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/param-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/prefer-await-to-callbacks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'promise/prefer-await-to-then'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/prefer-catch'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'promise/spec-only'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'promise/valid-params'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        radix?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react-perf/jsx-no-jsx-as-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react-perf/jsx-no-new-array-as-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react-perf/jsx-no-new-function-as-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react-perf/jsx-no-new-object-as-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/button-has-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/capitalized-calls'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/checked-requires-onchange-or-readonly'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/display-name'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/error-boundaries'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/exhaustive-deps'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/exhaustive-effect-dependencies'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/forbid-component-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/forbid-dom-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/forbid-elements'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/forward-ref-uses-ref'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/function-component-definition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/hook-use-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/iframe-missing-sandbox'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/immutability'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/incompatible-library'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/invariant'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/jsx-boolean-value'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-curly-brace-presence'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-filename-extension'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-fragments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-handler-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-max-depth'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-no-comment-textnodes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/jsx-no-constructed-context-values'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/jsx-no-duplicate-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/jsx-no-literals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-no-script-url'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown> | Array<unknown>;
        'react/jsx-no-target-blank'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-no-undef'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/jsx-no-useless-fragment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-pascal-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/jsx-props-no-spread-multi'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/jsx-props-no-spreading'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/memo-dependencies'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-array-index-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-children-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-clone-element'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-danger'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-danger-with-children'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-deriving-state-in-effects'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-did-mount-set-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/no-did-update-set-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/no-direct-mutation-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-find-dom-node'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-is-mounted'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-multi-comp'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/no-namespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-object-type-as-default-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-react-children'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-redundant-should-component-update'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-render-return-value'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-set-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-string-refs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/no-this-in-sfc'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-unescaped-entities'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/no-unknown-property'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/no-unsafe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/no-unstable-nested-components'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/no-will-update-set-state'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/only-export-components'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/prefer-es6-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/prefer-function-component'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/preserve-manual-memoization'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/purity'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/react-in-jsx-scope'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/refs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/require-render-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/rule-suppression'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/rules-of-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/self-closing-comp'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/set-state-in-effect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/set-state-in-render'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/state-in-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/static-components'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/style-prop-object'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'react/syntax'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/todo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/unsupported-syntax'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/use-memo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/void-dom-elements-no-children'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'react/void-use-memo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'require-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'require-unicode-regexp'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'require-yield'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'sort-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'sort-keys'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'sort-vars'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'symbol-description'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/adjacent-overload-signatures'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/array-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/await-thenable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/ban-ts-comment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/ban-tslint-comment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/ban-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/class-literal-property-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/consistent-generic-constructors'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/consistent-indexed-object-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/consistent-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/consistent-type-assertions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/consistent-type-definitions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/consistent-type-exports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/consistent-type-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/dot-notation'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/explicit-function-return-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/explicit-member-accessibility'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/explicit-module-boundary-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/method-signature-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-array-delete'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-base-to-string'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-confusing-non-null-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-confusing-void-expression'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-deprecated'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-duplicate-enum-values'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-duplicate-type-constituents'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-dynamic-delete'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-empty-interface'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-empty-object-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-explicit-any'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-extra-non-null-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-extraneous-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-floating-promises'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-for-in-array'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-generated-empty-object-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-implied-eval'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-import-type-side-effects'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-inferrable-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-invalid-void-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-meaningless-void-operator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-misused-new'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-misused-promises'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-misused-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-mixed-enums'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-namespace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-non-null-asserted-nullish-coalescing'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-non-null-asserted-optional-chain'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-non-null-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-redundant-type-constituents'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-require-imports'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-restricted-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-this-alias'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-unnecessary-boolean-literal-compare'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-unnecessary-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-unnecessary-parameter-property-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unnecessary-qualifier'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unnecessary-template-expression'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unnecessary-type-arguments'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unnecessary-type-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-unnecessary-type-constraint'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unnecessary-type-conversion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unnecessary-type-parameters'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-argument'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-call'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-declaration-merging'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-enum-comparison'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-function-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-member-access'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/no-unsafe-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-type-assertion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-unsafe-unary-minus'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-useless-default-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-useless-empty-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-var-requires'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/no-wrapper-object-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/non-nullable-type-assertion-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/only-throw-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/parameter-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/prefer-as-const'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-enum-initializers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-find'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-for-of'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-function-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-includes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-literal-enum-member'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/prefer-namespace-keyword'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-nullish-coalescing'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/prefer-optional-chain'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/prefer-promise-reject-errors'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/prefer-readonly'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/prefer-readonly-parameter-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/prefer-reduce-type-parameter'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-regexp-exec'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-return-this-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/prefer-string-starts-ends-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/prefer-ts-expect-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/promise-function-async'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/related-getter-setter-pairs'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/require-array-sort-compare'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/require-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'typescript/restrict-plus-operands'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/restrict-template-expressions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/return-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/strict-boolean-expressions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/strict-void-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/switch-exhaustiveness-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/triple-slash-reference'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/unbound-method'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/unified-signatures'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'typescript/use-unknown-in-catch-callback-variable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicode-bom'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/catch-error-name'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/consistent-assert'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/consistent-date-clone'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/consistent-empty-array-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/consistent-existence-index-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/consistent-function-scoping'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/consistent-template-literal-escape'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/custom-error-definition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/empty-brace-spaces'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/error-message'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/escape-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/explicit-length-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/explicit-timer-delay'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/filename-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/import-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/max-nested-calls'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/new-for-builtins'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-abusive-eslint-disable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-accessor-recursion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-anonymous-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-array-callback-reference'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-array-fill-with-reference-type'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-array-for-each'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-array-method-this-argument'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-array-reduce'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/no-array-reverse'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/no-array-sort'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/no-await-expression-member'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-await-in-promise-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-confusing-array-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-console-spaces'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-document-cookie'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-empty-file'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-hex-escape'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-immediate-mutation'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-instanceof-array'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-instanceof-builtins'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/no-invalid-fetch-options'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-invalid-remove-event-listener'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-length-as-slice-end'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-lonely-if'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-magic-array-flat-depth'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-negated-condition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-negation-in-equality-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-nested-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-new-array'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-new-buffer'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-null'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/no-object-as-default-parameter'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-process-exit'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-single-promise-in-promise-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-static-only-class'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-thenable'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-this-assignment'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-typeof-undefined'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/no-unnecessary-array-flat-depth'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-unnecessary-array-splice-count'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-unnecessary-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-unnecessary-slice-end'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-unreadable-array-destructuring'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-unreadable-iife'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-useless-collection-argument'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-useless-error-capture-stack-trace'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-useless-fallback-in-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-useless-iterator-to-array'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-useless-length-check'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-useless-promise-resolve-reject'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/no-useless-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-useless-switch-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/no-useless-undefined'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/no-zero-fractions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/number-literal-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/numeric-separators-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-add-event-listener'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-array-find'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-array-flat'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-array-flat-map'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-array-index-of'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-array-some'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-at'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-bigint-literals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-blob-reading-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-class-fields'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-classlist-toggle'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-code-point'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-date-now'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-default-parameters'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-dom-node-append'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-dom-node-dataset'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-dom-node-remove'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-dom-node-text-content'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-event-target'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-export-from'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-global-this'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-import-meta-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-includes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-keyboard-event-key'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-logical-operator-over-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-math-min-max'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-math-trunc'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-modern-dom-apis'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-modern-math-apis'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-module'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-native-coercion-functions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-negative-index'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-node-protocol'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-number-coercion'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-number-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-object-from-entries'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-optional-catch-binding'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-prototype-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-query-selector'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-reflect-apply'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-regexp-test'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-response-static-json'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-set-has'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-set-size'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-single-call'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-spread'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-string-raw'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-string-replace-all'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-string-slice'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-string-starts-ends-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-string-trim-start-end'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-structured-clone'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-ternary'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/prefer-top-level-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/prefer-type-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/relative-url-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/require-array-join-separator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/require-module-attributes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/require-module-specifiers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/require-number-to-fixed-digits-argument'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/require-post-message-target-origin'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/switch-case-braces'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/switch-case-break-position'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'unicorn/text-encoding-identifier-case'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'unicorn/throw-new-error'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'use-isnan'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'valid-typeof'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vars-on-top'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/consistent-each-for'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/consistent-test-filename'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/consistent-test-it'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/consistent-vitest-vi'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/expect-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/hoisted-apis-on-top'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/max-expects'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/max-nested-describe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/no-alias-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-commented-out-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-conditional-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-conditional-in-test'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-conditional-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-disabled-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-duplicate-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-focused-tests'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-hooks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/no-identical-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-import-node-test'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-importing-vitest-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-interpolation-in-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-large-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/no-mocks-import'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-restricted-matchers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/no-restricted-vi-methods'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/no-standalone-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/no-test-prefixes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-test-return-statement'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/no-unneeded-async-expect-function'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/padding-around-after-all-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/padding-around-test-blocks'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-called-exactly-once-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-called-once'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-called-times'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-called-with'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-comparison-matcher'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-describe-function-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-each'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-equality-matcher'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-expect-assertions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/prefer-expect-resolves'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-expect-type-of'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-hooks-in-order'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-hooks-on-top'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-import-in-mock'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/prefer-importing-vitest-globals'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-lowercase-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/prefer-mock-promise-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-mock-return-shorthand'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-snapshot-hint'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/prefer-spy-on'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-strict-boolean-matchers'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-strict-equal'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-to-be'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-to-be-falsy'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-to-be-object'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-to-be-truthy'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-to-contain'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-to-have-been-called-times'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-to-have-length'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/prefer-todo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/require-awaited-expect-poll'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/require-hook'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/require-local-test-context-for-concurrent-snapshots'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/require-mock-type-parameters'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/require-test-timeout'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/require-to-throw-message'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/require-top-level-describe'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/valid-describe-callback'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/valid-expect'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vitest/valid-expect-in-promise'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/valid-title'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vitest/warn-todo'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/component-definition-name-casing'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/define-emits-declaration'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/define-props-declaration'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/define-props-destructuring'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/max-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/next-tick-style'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/no-arrow-functions-in-watch'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-async-in-computed-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/no-computed-properties-in-data'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-deprecated-data-object-declaration'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-deprecated-delete-set'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-deprecated-destroyed-lifecycle'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-deprecated-events-api'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-deprecated-model-definition'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/no-deprecated-props-default-this'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-deprecated-vue-config-keycodes'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-dupe-keys'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/no-export-in-script-setup'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-expose-after-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-import-compiler-macros'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-lifecycle-after-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-multiple-slot-args'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-required-prop-with-default'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-reserved-component-names'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/no-reserved-keys'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/no-reserved-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/no-shared-component-data'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-side-effects-in-computed-properties'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-this-in-before-route-enter'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/no-watch-after-await'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/prefer-import-from-vue'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/prop-name-casing'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/require-default-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/require-default-prop'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/require-direct-export'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/require-prop-type-constructor'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/require-prop-types'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/require-render-return'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/require-slots-as-functions'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/require-typed-ref'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/return-in-computed-property'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
        'vue/return-in-emits-validator'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/valid-define-emits'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/valid-define-options'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/valid-define-props'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        'vue/valid-next-tick'?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown>;
        yoda?: 'allow' | 'off' | 'warn' | 'error' | 'deny' | number | Array<unknown> | Array<unknown>;
    };
    /**
     * Plugin-specific configuration for both built-in and custom plugins. This includes settings for built-in plugins such as `react` and `jsdoc` as well as configuring settings for JS custom plugins loaded via `jsPlugins`.
     *
     * @allowExtraKeys true
     */
    settings?: {
        /**
         * Configure Jest plugin rules.
         *
         * See [eslint-plugin-jest](https://github.com/jest-community/eslint-plugin-jest)'s configuration for a full reference.
         *
         * @allowExtraKeys true
         */
        jest?: {
            /** Jest version — accepts a number (`29`) or a semver string (`"29.1.0"` or `"v29.1.0"`), storing only the major version. ::: warning Using this config will override the `no-deprecated-functions` config set. ::: */
            version?: number | string;
        };
        /** @allowExtraKeys true */
        jsdoc?: {
            /**
             * Only for `require-(yields|returns|description|example|param|throws)` rule
             *
             * @default false
             */
            augmentsExtendsReplacesDocs?: boolean;
            /**
             * Only for `require-param-type` and `require-param-description` rule
             *
             * @default false
             */
            exemptDestructuredRootsFromChecks?: boolean;
            /**
             * For all rules but NOT apply to `empty-tags` rule
             *
             * @default false
             */
            ignoreInternal?: boolean;
            /**
             * For all rules but NOT apply to `check-access` and `empty-tags` rule
             *
             * @default false
             */
            ignorePrivate?: boolean;
            /**
             * Only for `require-(yields|returns|description|example|param|throws)` rule
             *
             * @default true
             */
            ignoreReplacesDocs?: boolean;
            /**
             * Only for `require-(yields|returns|description|example|param|throws)` rule
             *
             * @default false
             */
            implementsReplacesDocs?: boolean;
            /**
             * Only for `require-(yields|returns|description|example|param|throws)` rule
             *
             * @default true
             */
            overrideReplacesDocs?: boolean;
            /** @allowExtraKeys true */
            tagNamePreference?: any;
        };
        /**
         * Configure JSX A11y plugin rules.
         *
         * See [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y#configurations)'s configuration for a full reference.
         *
         * @allowExtraKeys true
         */
        'jsx-a11y'?: {
            /**
             * Map of attribute names to their DOM equivalents. This is useful for non-React frameworks that use different attribute names.
             *
             * Example:
             *
             * ```json
             * {
             *     "settings": {
             *         "jsx-a11y": {
             *             "attributes": {
             *                 "for": ["htmlFor", "for"]
             *             }
             *         }
             *     }
             * }
             * ```
             *
             * @allowExtraKeys true
             */
            attributes?: any;
            /**
             * To have your custom components be checked as DOM elements, you can provide a mapping of your component names to the DOM element name.
             *
             * Example:
             *
             * ```json
             * {
             *     "settings": {
             *         "jsx-a11y": {
             *             "components": {
             *                 "Link": "a",
             *                 "IconButton": "button"
             *             }
             *         }
             *     }
             * }
             * ```
             *
             * @allowExtraKeys true
             */
            components?: any;
            /**
             * An optional setting that define the prop your code uses to create polymorphic components. This setting will be used to determine the element type in rules that require semantic context.
             *
             * For example, if you set the `polymorphicPropName` to `as`, then this element:
             *
             * ```jsx
             * <Box as="h3">Hello</Box>;
             * ```
             *
             * Will be treated as an `h3`. If not set, this component will be treated as a `Box`.
             */
            polymorphicPropName?: string;
        };
        /**
         * Configure Next.js plugin rules.
         *
         * @allowExtraKeys true
         */
        next?: {
            /**
             * The root directory of the Next.js project.
             *
             * This is particularly useful when you have a monorepo and your Next.js project is in a subfolder.
             *
             * Example:
             *
             * ```json
             * {
             *     "settings": {
             *         "next": {
             *             "rootDir": "apps/dashboard/"
             *         }
             *     }
             * }
             * ```
             */
            rootDir?: string | Array<string>;
        };
        /**
         * Configure React plugin rules.
         *
         * Derived from [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react#configuration-legacy-eslintrc-)
         *
         * @allowExtraKeys true
         */
        react?: {
            /**
             * Functions that wrap React components and should be treated as HOCs.
             *
             * Example:
             *
             * ```jsonc
             * {
             * "settings": {
             * "react": {
             * "componentWrapperFunctions": ["observer", "withRouter"]
             * }
             * }
             * }
             * ```
             */
            componentWrapperFunctions?: Array<string>;
            /**
             * Components used as alternatives to `<form>` for forms, such as `<Formik>`.
             *
             * Example:
             *
             * ```jsonc
             * {
             * "settings": {
             * "react": {
             * "formComponents": [
             * "CustomForm",
             * // OtherForm is considered a form component and has an endpoint attribute
             * { "name": "OtherForm", "formAttribute": "endpoint" },
             * // allows specifying multiple properties if necessary
             * { "name": "Form", "formAttribute": ["registerEndpoint", "loginEndpoint"] }
             * ]
             * }
             * }
             * }
             * ```
             */
            formComponents?: Array<string | { attribute: string; name: string } | { attributes: Array<string>; name: string }>;
            /**
             * Components used as alternatives to `<a>` for linking, such as `<Link>`.
             *
             * Example:
             *
             * ```jsonc
             * {
             * "settings": {
             * "react": {
             * "linkComponents": [
             * "HyperLink",
             * // Use `linkAttribute` for components that use a different prop name
             * // than `href`.
             * { "name": "MyLink", "linkAttribute": "to" },
             * // allows specifying multiple properties if necessary
             * { "name": "Link", "linkAttribute": ["to", "href"] }
             * ]
             * }
             * }
             * }
             * ```
             */
            linkComponents?: Array<string | { attribute: string; name: string } | { attributes: Array<string>; name: string }>;
            /**
             * React version to use for version-specific rules.
             *
             * Accepts semver versions (e.g., "18.2.0", "17.0").
             *
             * Example:
             *
             * ```jsonc
             * {
             * "settings": {
             * "react": {
             * "version": "18.2.0"
             * }
             * }
             * }
             * ```
             *
             * @default null
             */
            version?: string;
        };
        /**
         * Configure Vitest plugin rules.
         *
         * See [eslint-plugin-vitest](https://github.com/vitest-dev/eslint-plugin-vitest)'s configuration for a full reference.
         *
         * @allowExtraKeys true
         */
        vitest?: {
            /**
             * Whether to enable typecheck mode for Vitest rules. When enabled, some rules will skip certain checks for describe blocks to accommodate TypeScript type checking scenarios.
             *
             * @default false
             */
            typecheck?: boolean;
        };
    };
}
