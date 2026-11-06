/**
 * Self-contained mirrors of the external tool config types.
 *
 * `prettier`, `eslint` and `@dprint/types` are optional peers of the published
 * package. Importing their types directly from `dist/*.d.ts` makes a clean
 * install fail to typecheck unless they happen to be installed, so the
 * published declarations carry these local mirrors instead. Each one exposes
 * the keys users reach for most and keeps an open index signature for the rest,
 * so unknown/newer options still typecheck (and known keys still autocomplete).
 */

/** Prettier's `Options` (the `.prettierrc` shape). */
export interface PrettierConfig {
    /** Wrap prose to this width. */
    proseWrap?: 'always' | 'never' | 'preserve';
    /** Print semicolons at the ends of statements. */
    semi?: boolean;
    /** Use single quotes instead of double quotes. */
    singleQuote?: boolean;
    /** Use single quotes in JSX. */
    jsxSingleQuote?: boolean;
    /** Print trailing commas wherever possible. */
    trailingComma?: 'none' | 'es5' | 'all';
    /** Print spaces between brackets in object literals. */
    bracketSpacing?: boolean;
    /** How to wrap object literals. */
    objectWrap?: 'preserve' | 'collapse';
    /** Put the `>` of a multi-line element on the last line. */
    bracketSameLine?: boolean;
    /** Deprecated alias for {@link bracketSameLine}. */
    jsxBracketSameLine?: boolean;
    /** Format only a segment of a file (start offset). */
    rangeStart?: number;
    /** Format only a segment of a file (end offset). */
    rangeEnd?: number;
    /** The parser to use (a built-in name or a plugin parser). */
    parser?: string | Record<string & {}, unknown>;
    /** The input filepath, used for parser inference. */
    filepath?: string;
    /** Only format files containing the `@format` pragma. */
    requirePragma?: boolean;
    /** Insert the `@format` pragma when formatting. */
    insertPragma?: boolean;
    /** Allow files to opt out with an ignore pragma. */
    checkIgnorePragma?: boolean;
    /** Include parentheses around a sole arrow function parameter. */
    arrowParens?: 'avoid' | 'always';
    /** Prettier plugins to load (module specifiers, URLs or plugin objects). */
    plugins?: Array<unknown>;
    /** How to handle whitespace in HTML. */
    htmlWhitespaceSensitivity?: 'css' | 'strict' | 'ignore';
    /** Which end-of-line characters to apply. */
    endOfLine?: 'auto' | 'lf' | 'crlf' | 'cr';
    /** Change when properties in objects are quoted. */
    quoteProps?: 'as-needed' | 'consistent' | 'preserve';
    /** Indent `<script>`/`<style>` content in Vue files. */
    vueIndentScriptAndStyle?: boolean;
    /** Control formatting of quoted code embedded in the file. */
    embeddedLanguageFormatting?: 'auto' | 'off';
    /** Enforce a single attribute per line in HTML/Vue/JSX. */
    singleAttributePerLine?: boolean;
    /** Where to print operators when binary expressions wrap. */
    experimentalOperatorPosition?: 'start' | 'end';
    /** Use curious ternaries. */
    experimentalTernaries?: boolean;
    /** The line length the printer wraps on. */
    printWidth?: number;
    /** The number of spaces per indentation level. */
    tabWidth?: number;
    /** Indent with tabs instead of spaces. */
    useTabs?: boolean;
    /** The parent parser, when formatting an embedded language. */
    parentParser?: string;
    /** @internal Whether the value is embedded in HTML. */
    __embeddedInHtml?: boolean;
    [key: string & {}]: unknown;
}

/** ESLint flat-config language options. */
export interface EslintLanguageOptions {
    /** The ECMAScript version to support (`latest` for the newest). */
    ecmaVersion?: number | 'latest';
    /** The source type. */
    sourceType?: 'script' | 'module' | 'commonjs';
    /** Globals added to the linting scope. */
    globals?: Record<string & {}, unknown>;
    /** The parser (an object or a module specifier). */
    parser?: unknown;
    /** Parser-specific options. */
    parserOptions?: Record<string & {}, unknown>;
}

/** ESLint flat-config linter options. */
export interface EslintLinterOptions {
    /** Disallow inline configuration comments. */
    noInlineConfig?: boolean;
    /** Report unused `eslint-disable` directives. */
    reportUnusedDisableDirectives?: boolean | 'off' | 'warn' | 'error' | 0 | 1 | 2;
}

/** ESLint's flat config object (`Linter.Config`). */
export interface EslintConfig {
    /** A name for this config object (useful in errors and tooling). */
    name?: string;
    /** The base path for relative file patterns. */
    basePath?: string;
    /** The glob patterns (or groups of patterns) this config applies to. */
    files?: Array<string | Array<string>>;
    /** The glob patterns this config ignores. */
    ignores?: Array<string>;
    /** The language used for linting (set by language plugins). */
    language?: string;
    /** Other configs to extend. */
    extends?: Array<string | EslintConfig>;
    /** Language options (parser, globals, ECMAScript version). */
    languageOptions?: EslintLanguageOptions;
    /** Linter behaviour options. */
    linterOptions?: EslintLinterOptions;
    /** Plugin implementations keyed by namespace. */
    plugins?: Record<string & {}, unknown>;
    /** A processor (a module specifier or a processor object). */
    processor?: unknown;
    /** Rule severities and options keyed by rule name. */
    rules?: Record<string & {}, unknown>;
    /** Shared settings passed to every rule. */
    settings?: Record<string & {}, unknown>;
    [key: string & {}]: unknown;
}

/**
 * Dprint's `dprint.json` configuration: global layout options plus arbitrary
 * per-language/plugin sections.
 */
export interface DprintConfig {
    /** The project type (used by dprint's sponsor check). */
    projectType?: 'openSource' | 'commercialSponsored' | 'commercialDidNotSponsor';
    /** Only format changed files on subsequent runs. */
    incremental?: boolean;
    /** The width the printer tries to stay under. */
    lineWidth?: number;
    /** The number of spaces per indent level. */
    indentWidth?: number;
    /** Indent with tabs instead of spaces. */
    useTabs?: boolean;
    /** The kind of newline to use. */
    newLineKind?: 'auto' | 'crlf' | 'lf' | 'system';
    /** The files to include (globs). */
    includes?: Array<string>;
    /** The files to exclude (globs). */
    excludes?: Array<string>;
    /** The plugins to load (module specifiers or plugin objects). */
    plugins?: Array<unknown>;
    /** TypeScript plugin options. */
    typescript?: Record<string & {}, unknown>;
    /** Any other language/plugin section. */
    [section: string & {}]: unknown;
}
