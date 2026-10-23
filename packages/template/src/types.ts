import type {
    Replacements,
    ToolchainTemplateKind,
    ToolchainTemplateSource,
} from '@deltabox/toolchain-shared';

/** What a template produces (shared with the registry source model). */
export type TemplateKind = ToolchainTemplateKind;

/** The context handed to a template action. */
export interface TemplateActionContext {
    /** The output directory the template was written to. */
    cwd: string;
    /** The template's source directory (local templates only). */
    templateDir?: string;
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** The resolved variable values. */
    variables: Record<string, string>;
    /** The selected package manager (default `yarn`). */
    packageManager: string;
    /** Log a line. */
    log: (message: string) => void;
}

/**
 * A post-scaffold action a template can declare. The built-in templates use it
 * for the opt-in **Install dependencies?** step (`builtin: 'install'`); a local
 * template can run its own logic through a JS `module` or a shell `command`.
 */
export interface TemplateAction {
    /** Stable id (also the key used by `--action <id>`). */
    id: string;
    /** Prompt text shown when interactive (default: `Run <id>?`). */
    prompt?: string;
    /** Whether the action runs by default (default false — opt-in). */
    default?: boolean;
    /** A builtin action to run (eg. `install`). */
    builtin?: 'install';
    /**
     * Local templates: a JS module path relative to the template directory whose
     * default export is `async (ctx: TemplateActionContext) => void`.
     */
    module?: string;
    /** Local templates: a shell command run in the output directory. */
    command?: string;
}

/** A value a template prompts for / substitutes. */
export interface TemplateVariable {
    /** The token name (also the `{{ token }}` used in files). */
    name: string;
    /** Prompt text. */
    prompt?: string;
    /** Default value. */
    default?: string;
    /**
     * A fixed set of choices: when present the value is picked from a select
     * rather than typed, and must be one of these (eg. `['yes', 'no']`).
     */
    options?: string[];
    /** Whether a value is required (default false). */
    required?: boolean;
}

/** A resolved template (builtin, local directory, or an online source). */
export interface Template {
    /** Stable id, used by `create --template <id>`. */
    id: string;
    /** Display name. */
    name: string;
    description?: string;
    kind: TemplateKind;
    /** How/where the template is loaded from. */
    source: ToolchainTemplateSource;
    tags?: string[];
    /** Whether creating from it needs network access. */
    online?: boolean;
    /** Builtin templates only: which local generator to run. */
    builtin?:
        | 'single'
        | 'application'
        | 'folder'
        | 'monorepo-root'
        | 'monorepo-example'
        | 'monorepo-workspace';
    /** Local templates only: the absolute directory holding `template.json`. */
    dir?: string;
    /** Variables a local template declares. */
    variables?: TemplateVariable[];
    /** Post-scaffold actions (install, custom JS/shell steps). */
    actions?: TemplateAction[];
    /** The token prefix used by a local template's files (default `{{`/`}}`). */
    tokens?: { open?: string; close?: string };
}

/** The `template.json` a local template directory may contain. */
export interface TemplateManifest {
    name?: string;
    description?: string;
    kind?: TemplateKind;
    tags?: string[];
    variables?: TemplateVariable[];
    /** Post-scaffold actions. */
    actions?: TemplateAction[];
    /** Globs/paths (relative) never copied. */
    ignore?: string[];
    /** Commands to run after scaffolding (documentation only for now). */
    post?: string[];
    /** Custom token delimiters. */
    tokens?: { open?: string; close?: string };
}
