/** A formatter tool, highest priority first. */
export type FormatterTool = 'oxc' | 'biome' | 'prettier' | 'dprint';

/** A linter tool, highest priority first. */
export type LinterTool = 'oxc' | 'biome' | 'eslint';
