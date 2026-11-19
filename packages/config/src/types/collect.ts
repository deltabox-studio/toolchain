import type { Logger } from '@deltabox/toolchain/shared';

import type { ConfigDef, ConfigValueKind, ConfigValueType } from './definition.js';

export type { ConfigValueKind };

/** The value source the runtime parser understands. */
export type ConfigSource = 'file' | 'env' | 'cli';

/** The presence states include/exclude filters can target. */
export type CollectValueKind = 'required' | 'undefined' | 'null' | 'defined';

/** A per-type presence filter. */
export type CollectValueFilter =
    | boolean
    | { type?: ConfigValueType; include?: boolean; exclude?: boolean }
    | Array<{ type?: ConfigValueType; include?: boolean; exclude?: boolean }>;

/** Value-kind keyed include/exclude filters. */
export type CollectFilterOptions =
    | Partial<Record<CollectValueKind, boolean>>
    | Partial<Record<CollectValueKind, CollectValueFilter>>;

/** A path filter: a glob/list of globs, or a predicate on the definition. */
export type CollectPathFilter = string | readonly string[] | ((def: ConfigDef) => boolean);

/** Every supported include/exclude filter. */
export type CollectFilter = CollectPathFilter | CollectFilterOptions;

/** The context passed to a custom message rewriter. */
export interface RewriteMessageContext<Scope = string, Name = string, SourceName = string> {
    scope: Scope | (string & {});
    name: Name | (string & {});
    sourceName: SourceName | (string & {});
    source: 'file' | 'cli' | 'env' | (string & {});
    sourceType?: ConfigValueType;
    flag?: string | (string & {});
    path: string;
    value: unknown;
    originalMessage: string;
}

/** Rewrite a validation message: replacement pairs or a callback. */
export type RewriteMessage =
    | { find: RegExp | string; replacement: string }
    | Array<{ find: RegExp | string; replacement: string }>
    | ((context: RewriteMessageContext) => string | Promise<string>);

/** Default messages keyed by value kind (plural keys). */
export type DefaultMessagesByKind = {
    message?: string;
    booleans?: string;
    numbers?: string;
    strings?: string;
    arrays?: string;
    objects?: string;
    enums?: string;
    unions?: string;
    tuples?: string;
    records?: string;
    maps?: string;
    sets?: string;
    dates?: string;
    bigints?: string;
    symbols?: string;
    nulls?: string;
    undefineds?: string;
    voids?: string;
    nevers?: string;
    anys?: string;
    unknowns?: string;
    literals?: string;
    promises?: string;
    functions?: string;
    files?: string;
    customs?: string;
    /** Future/third-party Zod kinds remain addressable. */
    [kind: string]: string | undefined;
};

/** A default message: one string or a per-kind map. */
export type DefaultMessage = string | DefaultMessagesByKind;

/** Where an error is reported in the collected set. */
export type ErrorTriggerPosition = 'initial' | 'last' | 'collect-all';

/** How errors are selected for reporting. */
export type ErrorTrigger =
    | ErrorTriggerPosition
    | {
          type?: ConfigValueKind;
          position: ErrorTriggerPosition;
      }
    | Record<ConfigValueKind, ErrorTriggerPosition>
    | Partial<Record<ConfigValueKind, ErrorTriggerPosition>>;

/** How validation problems are reported. */
export interface CollectErrorOptions {
    /** `throw`/`true` throws; `warn`/`false` logs; `silent` ignores. Default `throw`. */
    errorLevel?: boolean | 'throw' | 'warn' | 'silent';
    /** The configured dbx logger, falling back to the internal one. */
    logger?: Logger;
    /** Rewrite problem messages (wins over `defaultMessage`). */
    rewriteMessage?: RewriteMessage;
    /** Build the problem message when no `rewriteMessage` is set. */
    defaultMessage?: DefaultMessage;
    /** Which collected error(s) to report (default `collect-all`). */
    trigger?: ErrorTrigger;
}

/** Options for the definition collector. */
export interface CollectOptions {
    /** The env-var prefix (default `APP_`); `null` disables it. */
    envPrefix?: string | null;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: (env: string) => string;
    /** Maximum schema nesting depth to walk (default: unlimited). */
    maxDepth?: number;
    /** Only keep these config paths or presence kinds. */
    include?: CollectFilter;
    /** Drop these config paths or presence kinds. */
    exclude?: CollectFilter;
    /** A flat env source used by the runtime collector. */
    envSource?: Record<string, string | undefined>;
    /** The CLI argv used by the runtime collector. */
    argv?: string[];
    /** Validate the resolved config through `schema.safeParse()`. */
    validate?: boolean;
    /** How validation problems are reported. */
    errorOptions?: CollectErrorOptions;
    /** An optional narrowing predicate applied after the include/exclude filters. */
    filter?: (def: ConfigDef) => boolean;
}

/** A narrowed definition collection: `filter` both selects and types the definitions. */
export interface CollectNarrowOptions<T extends ConfigDef> extends CollectOptions {
    filter: (def: ConfigDef) => def is T;
}

/** Options shared by the runtime parsers. */
export interface ParseConfigOptions extends CollectOptions {
    /** The input source (default: every enabled source). */
    source?: ConfigSource;
}
