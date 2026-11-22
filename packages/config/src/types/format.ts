import type { CliCommand, CliOption } from '@deltabox/toolchain/shared';

/** A colouriser receives the rendered text plus the item it belongs to. */
export type ConfigFormatColor<T = unknown> = (text: string, item?: T) => string;

/** Colour hooks shared by commands, options, values, descriptions and usage. */
export interface ConfigFormatColors {
    /** Command names in usage lines and command lists. */
    command?: ConfigFormatColor;
    /** Option terms (`--json`, `-o, --out <path>`). */
    option?: ConfigFormatColor;
    /** Value placeholders (`<path>`, `[kind]`). */
    value?: ConfigFormatColor<string>;
    /** Descriptions (of commands, options and arguments). */
    description?: ConfigFormatColor<string>;
    /** The usage line and headings. */
    usage?: ConfigFormatColor<string>;
}

/** Rounded-box renderer options. */
export interface ConfigBoxOptions {
    /** Padding around the content. @default `1` */
    padding?:
        | number
        | {
              top?: number;
              right?: number;
              bottom?: number;
              left?: number;
          };
    /** Corner symbols (each defaults to a rounded corner). */
    corners?: {
        topLeft?: string;
        topRight?: string;
        bottomLeft?: string;
        bottomRight?: string;
    };
    /** Horizontal edge symbol. @default "─" */
    horizontal?: string;
    /** Vertical edge symbol. @default "│" */
    vertical?: string;
    /** Border colour hook. */
    color?: ConfigFormatColor;
    /** Optional title embedded in the top border. */
    title?: string;
}

/** A fully custom help formatter receives the resolved help model. */
export interface ConfigHelpModel {
    /** The program/command name (including its parent path). */
    name: string;
    /** The command description (or the program description). */
    description?: string;
    /** The command/options usage line. */
    usage: string;
    /** The options of the selected command (including `--help`). */
    options: readonly CliOption[];
    /** The subcommands of the selected command. */
    commands: readonly CliCommand<any, any>[];
    /** The command-grouping setting used to render {@link commands}. */
    groups?: ConfigProgramGroupsOptions;
    /** The selected command, when rendering command help. */
    command?: CliCommand<any, any>;
}

/** Help output templates. */
export type ConfigHelpTemplate =
    | 'box'
    | 'plain'
    | ((model: ConfigHelpModel, options: ConfigProgramFormatOptions) => string);

/**
 * Help grouping for options and commands.
 *
 * `true` enables grouping and derives command groups from delimited command
 * names (`vite:list` -> `vite`); `false` renders flat lists. An object can
 * disable the automatic command derivation or change the delimiter(s).
 */
export type ConfigProgramGroupsOptions =
    | boolean
    | {
          /**
           * Derive groups from delimited command-name paths.
           * @default `true`
           */
          auto?: boolean;
          /**
           * One or more delimiters used for automatic grouping.
           * @default `':'`
           */
          delimiter?: string | readonly string[];
      };

/** Error output templates. */
export type ConfigErrorTemplate =
    | 'box'
    | 'message'
    | ((model: ConfigErrorModel, options: ConfigProgramFormatOptions) => string);

/** A fully custom error formatter receives the resolved error model. */
export interface ConfigErrorModel {
    /** One entry per error (an aggregate error is flattened). */
    errors: readonly {
        message: string;
        stack?: string;
        name: string;
    }[];
}

/** Per-command formatter overrides (merged recursively with the defaults). */
export interface ConfigCommandFormatOptions {
    /** Colour overrides for this command and its subcommands. */
    colors?: ConfigFormatColors;
    /** Help template override. */
    help?: ConfigHelpTemplate;
    /** Box options override. */
    box?: ConfigBoxOptions;
    /** Error options override. */
    error?: ConfigProgramErrorFormatOptions;
}

/** Error formatting options. */
export interface ConfigProgramErrorFormatOptions {
    /** Output template. @default "box" */
    template?: ConfigErrorTemplate;
    /** Colourise the error message. */
    messageColor?: ConfigFormatColor;
    /** Colourise the stack trace. */
    stackColor?: ConfigFormatColor;
    /** Include stack traces. @default true */
    showStack?: boolean;
    /** Print only the messages (no stack, no box). */
    messageOnly?: boolean;
    /** Box options for the default boxed template. */
    box?: ConfigBoxOptions;
    /** Override the built-in invalid-argv messages. */
    messages?: Partial<Record<ConfigProgramErrorMessageKey, string | ((input: string) => string)>>;
}

/** The invalid-argv messages a program can override. */
export type ConfigProgramErrorMessageKey =
    | 'unknownCommand'
    | 'unknownOption'
    | 'missingOptionValue'
    | 'excessArguments'
    | 'missingArguments'
    | 'invalidValue'
    | 'missingCommand'
    | 'unknownError';

/** Program-wide help/error formatting. */
export interface ConfigProgramFormatOptions {
    /** Program-level colour defaults (identity when omitted). */
    colors?: ConfigFormatColors;
    /** Help formatting. */
    help?: {
        /** Template. @default "box" */
        template?: ConfigHelpTemplate;
        /** Colour overrides for help (merged with {@link colors}). */
        colors?: ConfigFormatColors;
        /** Box options for the default boxed template. */
        box?: ConfigBoxOptions;
    };
    /** Error formatting. */
    error?: ConfigProgramErrorFormatOptions;
    /** Per-command overrides keyed by command name. */
    commands?: Record<string, ConfigCommandFormatOptions>;
    /** Per-option colour overrides keyed by the long flag (`--json`). */
    options?: Record<string, ConfigFormatColor>;
}
