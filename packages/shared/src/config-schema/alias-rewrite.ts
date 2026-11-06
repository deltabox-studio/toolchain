/**
 * URL-rewrite-style rewriting for auto-wired tsconfig alias keys.
 *
 * `rewriteAlias` only touches the `paths` keys that auto-wiring generated; any
 * key you wrote yourself is preserved. A pattern is matched against a generated
 * alias key and the replacement is applied with `String.prototype.replace`, so
 * `$1`, `$2`, ... (and `$&`) work as capture-group references.
 *
 * A string pattern is a regular-expression source (use `^`/`$` for whole-key
 * matches), a `RegExp` is used as-is, and an array of patterns tries each one in
 * order until one matches. When `rewriteAlias` is an array of rules, the rules
 * are applied in order and the first matching rule wins.
 */

/** One pattern (or list of patterns) an alias rewrite can match. */
export type ToolchainTsconfigAliasRewriteKey = string | RegExp | Array<string | RegExp>;

/** A single ordered alias rewrite rule. */
export interface ToolchainTsconfigAliasRewriteRule {
    /** Pattern(s) matched against generated alias keys. */
    pattern: ToolchainTsconfigAliasRewriteKey;
    /** Replacement for the matched key (`$1`, `$2`, ... refer to capture groups). */
    replacement: string;
}

/**
 * Auto-alias rewrite: either a `Record<string, string>` map of string patterns
 * to replacements, or an ordered array of {@link ToolchainTsconfigAliasRewriteRule}
 * (which additionally accepts `RegExp` patterns and arrays of patterns).
 */
export type ToolchainTsconfigAliasRewrite =
    | Record<string, string>
    | ToolchainTsconfigAliasRewriteRule[];
