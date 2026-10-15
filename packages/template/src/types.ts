import type { ToolingTemplateKind, ToolingTemplateSource } from '@deltabox/toolchain-shared';

/** What a template produces (shared with the registry source model). */
export type TemplateKind = ToolingTemplateKind;

/** A value a local template prompts for / substitutes. */
export interface TemplateVariable {
    /** The token name (also the `{{ token }}` used in files). */
    name: string;
    /** Prompt text. */
    prompt?: string;
    /** Default value. */
    default?: string;
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
    source: ToolingTemplateSource;
    tags?: string[];
    /** Whether creating from it needs network access. */
    online?: boolean;
    /** Builtin templates only: which local generator to run. */
    builtin?: 'single' | 'application' | 'folder' | 'monorepo-root' | 'monorepo-workspace';
    /** Local templates only: the absolute directory holding `template.json`. */
    dir?: string;
    /** Variables a local template declares. */
    variables?: TemplateVariable[];
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
    /** Globs/paths (relative) never copied. */
    ignore?: string[];
    /** Commands to run after scaffolding (documentation only for now). */
    post?: string[];
    /** Custom token delimiters. */
    tokens?: { open?: string; close?: string };
}
