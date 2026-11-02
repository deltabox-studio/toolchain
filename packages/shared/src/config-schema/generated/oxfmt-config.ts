// Generated from Oxfmt's configuration_schema.json — do not edit.
// Run `yarn config:generate` to refresh.

export interface OxfmtConfig {
    /**
     * Include parentheses around a sole arrow function parameter.
     *
     * - Languages: JS, JSX, TS, TSX
     * - Default: `"always"`
     */
    arrowParens?: 'always' | 'avoid';
    /**
     * Format matched files as the given language, instead of detecting it from the file name. e.g.
     * Angular templates named `*.html`, or `*.wxml` files formatted as HTML. When a file matches
     * multiple associations, the later one takes precedence (array order matters).
     *
     * - Default: `[]`
     */
    associations?: Array<{
        excludeFiles?: Array<string>;
        files: Array<string>;
        language:
            | 'javascript'
            | 'jsx'
            | 'typescript'
            | 'tsx'
            | 'json'
            | 'jsonc'
            | 'json5'
            | 'css'
            | 'scss'
            | 'less'
            | 'graphql'
            | 'yaml'
            | 'markdown'
            | 'toml'
            | 'html'
            | 'angular-html'
            | 'vue'
            | 'svelte'
            | 'astro'
            | 'handlebars'
            | 'mdx';
    }>;
    /**
     * Options for `prettier-plugin-astro`.
     *
     * Pass `true` or an object to enable `.astro` file formatting, `false` to disable (handy in
     * overrides). Setting `true` resets to defaults, dropping options inherited from a parent scope.
     *
     * NOTE: `prettier-plugin-astro` requires the `@astrojs/compiler-rs` package at runtime. Oxfmt does
     * NOT bundle it, so install it in your project, otherwise formatting fails.
     *
     * - Languages: Astro
     * - Default: Disabled
     */
    astro?:
        | boolean
        | {
              allowShorthand?: boolean;
              compressHTML?: 'jsx' | 'html' | 'none';
              skipFrontmatter?: boolean;
          };
    /**
     * Put the `>` of a multi-line element at the end of the last line, instead of being alone on the
     * next line (does not apply to self-closing elements).
     *
     * - Languages: JSX, TSX, HTML, Angular, Vue, MJML, Svelte, Astro
     * - Default: `false`
     */
    bracketSameLine?: boolean;
    /**
     * Print spaces between brackets in object literals.
     *
     * - Languages: JS, JSX, TS, TSX, JSON, JSONC, JSON5, GraphQL, YAML
     * - Default: `true`
     */
    bracketSpacing?: boolean;
    /**
     * Control whether to format embedded parts in the file. For example:
     *
     * - CSS-in-JS: template literal
     * - JS-in-Vue: `<script>` block
     * - JS-in-Markdown: code fence
     * - YAML-in-CSS/Markdown: front matter
     *
     * With `"off"`, these parts are kept as-is.
     *
     * NOTE: Some languages behave differently. For Svelte, formatting fails with `"off"`, a limitation
     * of `prettier-plugin-svelte`. For Astro, the frontmatter is still formatted, but by Prettier
     * instead of Oxfmt (use `astro.skipFrontmatter` to keep it as-is).
     *
     * - Languages: JS, JSX, TS, TSX, CSS, SCSS, Less, HTML, Vue, Angular, Svelte, Astro, Markdown, MDX
     * - Default: `"auto"`
     */
    embeddedLanguageFormatting?: 'auto' | 'off';
    /**
     * Which end of line characters to apply.
     *
     * NOTE: `"auto"` is not supported.
     *
     * - Languages: All
     * - Default: `"lf"`
     * - Overrides `.editorconfig.end_of_line`
     */
    endOfLine?: 'lf' | 'crlf' | 'cr';
    /**
     * When expressions wrap lines, print operators at the start of new lines (`"start"`) or at the end
     * of previous lines (`"end"`).
     *
     * - Languages: JS, JSX, TS, TSX
     * - Default: `"end"`
     */
    experimentalOperatorPosition?: 'start' | 'end';
    /**
     * Specify the global whitespace sensitivity.
     *
     * - Languages: HTML, Angular, Vue, Handlebars, Svelte
     * - Default: `"css"`
     */
    htmlWhitespaceSensitivity?: 'css' | 'strict' | 'ignore';
    /**
     * Ignore files matching these glob patterns. Patterns use gitignore-style matching, rooted at the
     * directory containing the configuration file. Files outside that directory cannot be matched;
     * patterns containing `..` are rejected as a configuration error.
     *
     * - Default: `[]`
     */
    ignorePatterns?: Array<string>;
    /**
     * Whether to insert a final newline at the end of the file.
     *
     * - Languages: All
     * - Default: `true`
     * - Overrides `.editorconfig.insert_final_newline`
     */
    insertFinalNewline?: boolean;
    /**
     * Enable JSDoc comment formatting.
     *
     * Normalizes JSDoc comments: tag aliases are canonicalized, descriptions are capitalized, long
     * lines are wrapped, and short comments are collapsed to single-line.
     *
     * Pass `true` or an object to enable, `false` to disable.
     *
     * - Languages: JS, JSX, TS, TSX
     * - Default: Disabled
     */
    jsdoc?:
        | boolean
        | {
              addDefaultToDescription?: boolean;
              bracketSpacing?: boolean;
              capitalizeDescriptions?: boolean;
              commentLineStrategy?: 'singleLine' | 'multiline' | 'keep';
              descriptionTag?: boolean;
              descriptionWithDot?: boolean;
              keepUnparsableExampleIndent?: boolean;
              lineWrappingStyle?: 'greedy' | 'balance';
              preferCodeFences?: boolean;
              separateReturnsFromParam?: boolean;
              separateTagGroups?: boolean;
          };
    /**
     * Use single quotes instead of double quotes in JSX.
     *
     * - Languages: JSX, TSX
     * - Default: `false`
     */
    jsxSingleQuote?: boolean;
    /**
     * How to wrap object literals when they could fit on one line or span multiple lines.
     *
     * By default, formats objects as multi-line if there is a newline prior to the first property.
     * Authors can use this heuristic to contextually improve readability, though it has some
     * downsides.
     *
     * - Languages: JS, JSX, TS, TSX, JSON, JSONC, JSON5
     * - Default: `"preserve"`
     */
    objectWrap?: 'preserve' | 'collapse';
    /**
     * File-specific overrides. When a file matches multiple overrides, the later override takes
     * precedence (array order matters).
     *
     * - Default: `[]`
     */
    overrides?: Array<{
        excludeFiles?: Array<string>;
        files: Array<string>;
        options?: {
            arrowParens?: 'always' | 'avoid';
            astro?:
                | boolean
                | {
                      allowShorthand?: boolean;
                      compressHTML?: 'jsx' | 'html' | 'none';
                      skipFrontmatter?: boolean;
                  };
            bracketSameLine?: boolean;
            bracketSpacing?: boolean;
            embeddedLanguageFormatting?: 'auto' | 'off';
            endOfLine?: 'lf' | 'crlf' | 'cr';
            experimentalOperatorPosition?: 'start' | 'end';
            htmlWhitespaceSensitivity?: 'css' | 'strict' | 'ignore';
            insertFinalNewline?: boolean;
            jsdoc?:
                | boolean
                | {
                      addDefaultToDescription?: boolean;
                      bracketSpacing?: boolean;
                      capitalizeDescriptions?: boolean;
                      commentLineStrategy?: 'singleLine' | 'multiline' | 'keep';
                      descriptionTag?: boolean;
                      descriptionWithDot?: boolean;
                      keepUnparsableExampleIndent?: boolean;
                      lineWrappingStyle?: 'greedy' | 'balance';
                      preferCodeFences?: boolean;
                      separateReturnsFromParam?: boolean;
                      separateTagGroups?: boolean;
                  };
            jsxSingleQuote?: boolean;
            objectWrap?: 'preserve' | 'collapse';
            printWidth?: number;
            proseWrap?: 'always' | 'never' | 'preserve';
            quoteProps?: 'as-needed' | 'consistent' | 'preserve';
            semi?: boolean;
            singleAttributePerLine?: boolean;
            singleQuote?: boolean;
            sortImports?:
                | boolean
                | {
                      customGroups?: Array<{
                          elementNamePattern?: Array<string>;
                          groupName?: string;
                          modifiers?: Array<
                              'side_effect' | 'type' | 'value' | 'default' | 'wildcard' | 'named'
                          >;
                          selector?:
                              | 'type'
                              | 'side_effect_style'
                              | 'side_effect'
                              | 'style'
                              | 'index'
                              | 'sibling'
                              | 'parent'
                              | 'subpath'
                              | 'internal'
                              | 'builtin'
                              | 'external'
                              | 'import';
                      }>;
                      groups?: Array<{ newlinesBetween: boolean } | string | Array<string>>;
                      ignoreCase?: boolean;
                      internalPattern?: Array<string>;
                      newlinesBetween?: boolean;
                      order?: 'asc' | 'desc';
                      partitionByComment?: boolean;
                      partitionByNewline?: boolean;
                      sortSideEffects?: boolean;
                  };
            sortPackageJson?: boolean | { sortScripts?: boolean };
            sortTailwindcss?:
                | boolean
                | {
                      attributes?: Array<string>;
                      config?: string;
                      functions?: Array<string>;
                      preserveDuplicates?: boolean;
                      preserveWhitespace?: boolean;
                      stylesheet?: string;
                  };
            svelte?:
                | boolean
                | { allowShorthand?: boolean; indentScriptAndStyle?: boolean; sortOrder?: string };
            tabWidth?: number;
            trailingComma?: 'all' | 'es5' | 'none';
            useTabs?: boolean;
            vueIndentScriptAndStyle?: boolean;
        };
    }>;
    /**
     * Specify the line length that the printer will wrap on.
     *
     * If you don't want line wrapping when formatting Markdown, you can set the `proseWrap` option to
     * disable it.
     *
     * - Languages: All
     * - Default: `100`
     * - Overrides `.editorconfig.max_line_length`
     */
    printWidth?: number;
    /**
     * How to wrap prose.
     *
     * - `"always"`: Wrap prose to the print width
     * - `"never"`: Put each prose block on a single line, relying on editor/viewer soft wrapping
     * - `"preserve"`: Keep wrapping as-is
     *
     * By default, wrapping is preserved, since some services use a linebreak-sensitive renderer (e.g.
     * GitHub comments, BitBucket).
     *
     * - Languages: Markdown, MDX, YAML
     * - Default: `"preserve"`
     */
    proseWrap?: 'always' | 'never' | 'preserve';
    /**
     * Change when properties in objects are quoted.
     *
     * - Languages: JS, JSX, TS, TSX
     * - Default: `"as-needed"`
     */
    quoteProps?: 'as-needed' | 'consistent' | 'preserve';
    /**
     * Print semicolons at the ends of statements.
     *
     * - Languages: JS, JSX, TS, TSX
     * - Default: `true`
     */
    semi?: boolean;
    /**
     * Enforce single attribute per line.
     *
     * - Languages: JSX, TSX, HTML, Angular, Vue, MJML, Svelte, Astro
     * - Default: `false`
     */
    singleAttributePerLine?: boolean;
    /**
     * Use single quotes instead of double quotes.
     *
     * For JSX, you can set the `jsxSingleQuote` option.
     *
     * - Languages: JS, JSX, TS, TSX, CSS, Less, SCSS, Markdown, MDX, YAML, Handlebars, Svelte, Astro
     * - Default: `false`
     * - Overrides `.editorconfig.quote_type`
     */
    singleQuote?: boolean;
    /**
     * Sort import statements.
     *
     * Uses a similar algorithm to
     * [eslint-plugin-perfectionist/sort-imports](https://perfectionist.dev/rules/sort-imports).
     *
     * Pass `true` or an object to enable, `false` to disable.
     *
     * - Languages: JS, JSX, TS, TSX
     * - Default: Disabled
     */
    sortImports?:
        | boolean
        | {
              customGroups?: Array<{
                  elementNamePattern?: Array<string>;
                  groupName?: string;
                  modifiers?: Array<
                      'side_effect' | 'type' | 'value' | 'default' | 'wildcard' | 'named'
                  >;
                  selector?:
                      | 'type'
                      | 'side_effect_style'
                      | 'side_effect'
                      | 'style'
                      | 'index'
                      | 'sibling'
                      | 'parent'
                      | 'subpath'
                      | 'internal'
                      | 'builtin'
                      | 'external'
                      | 'import';
              }>;
              groups?: Array<{ newlinesBetween: boolean } | string | Array<string>>;
              ignoreCase?: boolean;
              internalPattern?: Array<string>;
              newlinesBetween?: boolean;
              order?: 'asc' | 'desc';
              partitionByComment?: boolean;
              partitionByNewline?: boolean;
              sortSideEffects?: boolean;
          };
    /**
     * Sort `package.json` keys.
     *
     * The order is NOT compatible with
     * [prettier-plugin-packagejson](https://github.com/matzkoh/prettier-plugin-packagejson), but we
     * believe it is clearer and easier to navigate.
     *
     * - Languages: JSON (`package.json` only)
     * - Default: `true`
     */
    sortPackageJson?: boolean | { sortScripts?: boolean };
    /**
     * Sort Tailwind CSS classes.
     *
     * Uses the same algorithm as
     * [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss).
     * Option names omit the `tailwind` prefix used in the original plugin (e.g. `config` instead of
     * `tailwindConfig`).
     *
     * Pass `true` or an object to enable, `false` to disable.
     *
     * - Languages: JS, JSX, TS, TSX, HTML, Vue, Angular, Handlebars, CSS, SCSS, Less, Svelte, Astro
     * - Default: Disabled
     */
    sortTailwindcss?:
        | boolean
        | {
              attributes?: Array<string>;
              config?: string;
              functions?: Array<string>;
              preserveDuplicates?: boolean;
              preserveWhitespace?: boolean;
              stylesheet?: string;
          };
    /**
     * Options for `prettier-plugin-svelte`.
     *
     * Pass `true` or an object to enable `.svelte` file formatting, `false` to disable (handy in
     * overrides). Setting `true` resets to defaults, dropping options inherited from a parent scope.
     *
     * NOTE: `prettier-plugin-svelte` requires the `svelte` package (`svelte/compiler`) at runtime.
     * Oxfmt does NOT bundle it, so install it in your project, otherwise formatting fails.
     *
     * - Languages: Svelte
     * - Default: Disabled
     */
    svelte?:
        | boolean
        | { allowShorthand?: boolean; indentScriptAndStyle?: boolean; sortOrder?: string };
    /**
     * Specify the number of spaces per indentation-level.
     *
     * - Languages: All
     * - Default: `2`
     * - Overrides `.editorconfig.indent_size` (falls back to `.editorconfig.tab_width`)
     */
    tabWidth?: number;
    /**
     * Print trailing commas wherever possible in multi-line comma-separated syntactic structures.
     *
     * A single-line array, for example, never gets trailing commas.
     *
     * - Languages: JS, JSX, TS, TSX, JSONC, JSON5, TOML, CSS, Less, SCSS, YAML
     * - Default: `"all"`
     */
    trailingComma?: 'all' | 'es5' | 'none';
    /**
     * Indent lines with tabs instead of spaces.
     *
     * - Languages: All
     * - Default: `false`
     * - Overrides `.editorconfig.indent_style`
     */
    useTabs?: boolean;
    /**
     * Whether or not to indent the code inside `<script>` and `<style>` tags in Vue files.
     *
     * - Languages: Vue
     * - Default: `false`
     */
    vueIndentScriptAndStyle?: boolean;
    [key: string]: unknown;
}
