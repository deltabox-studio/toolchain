import type { Replacements } from '@deltabox/toolchain/shared';

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
    /** The selected package manager. @default `yarn` */
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
    /** Whether the action runs by default. @default `false` */
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
