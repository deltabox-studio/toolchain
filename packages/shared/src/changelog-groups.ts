/**
 * Typed `changelog.groups` configuration. The runtime implementation lives in
 * `@deltabox/toolchain-changelog`; these shapes are shared so `dbx.config.*`
 * gets callback-aware types without a package cycle.
 */

/** The subset of a grouped changelog item exposed to callbacks. */
export interface ChangelogGroupItem {
    parsed: { type: string; scope?: string; breaking: boolean; rest: string };
    text: string;
    bodyParagraphs: string[][];
}

/** Context passed to the whole `groups` callback. */
export interface ChangelogGroupsContext {
    /** The CC types present in the current changelog. */
    types: string[];
    /** Every item being grouped. */
    items: ChangelogGroupItem[];
}

/** Context passed to a per-group title/order/hidden callback. */
export interface ChangelogGroupContext extends ChangelogGroupsContext {
    /** The CC type of this group. */
    type: string;
    /** The built-in title for this type. */
    defaultTitle: string;
    /** The group's position in the configured/default order. */
    index: number;
    /** The items in this group. */
    groupItems: ChangelogGroupItem[];
}

export type ChangelogGroupTitle = string | ((ctx: ChangelogGroupContext) => string);
export type ChangelogGroupOrder = number | ((ctx: ChangelogGroupContext) => number);
export type ChangelogGroupHidden = boolean | ((ctx: ChangelogGroupContext) => boolean);

/** One group entry: a CC type, or its type + custom presentation. */
export interface ChangelogGroupConfig {
    /** The CC type (required for object entries in an array). */
    type?: string;
    /** Custom heading title. */
    title?: ChangelogGroupTitle;
    /** Sort position; lower comes first. */
    order?: ChangelogGroupOrder;
    /** Omit this group from the rendered changelog. */
    hidden?: ChangelogGroupHidden;
}

export type ChangelogGroupEntry = string | ChangelogGroupConfig;

/**
 * The `changelog.groups` setting. An array sets the order (and optionally
 * titles), a record maps CC types to titles/options in key order, and a callback
 * computes either form from the types/items in the current run.
 */
export type ChangelogGroupsSetting =
    | ChangelogGroupEntry[]
    | Record<string, string | ChangelogGroupConfig | boolean>
    | ((ctx: ChangelogGroupsContext) => ChangelogGroupsSetting);
