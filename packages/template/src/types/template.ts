import type { ToolchainTemplateKind, ToolchainTemplateSource } from '@deltabox/toolchain/shared';

import type { TemplateAction } from './action.js';

/** What a template produces (shared with the registry source model). */
export type TemplateKind = ToolchainTemplateKind;

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
    /** Whether a value is required. @default `false` */
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
        | 'monorepo-workspace'
        | 'vitepress'
        | 'express'
        | 'bun'
        | 'fastify'
        | 'orpc'
        | 'file-server'
        | 'file-server-s3'
        | 'file-server-bun-s3'
        | 'file-server-minio'
        | 'file-server-rclone'
        | 'ollama-chat';
    /** Local templates only: the absolute directory holding `template.json`. */
    dir?: string;
    /** Variables a local template declares. */
    variables?: TemplateVariable[];
    /** Post-scaffold actions (install, custom JS/shell steps). */
    actions?: TemplateAction[];
    /** The token prefix used by a local template's files. @default `{{`/`}}` */
    tokens?: { open?: string; close?: string };
}
