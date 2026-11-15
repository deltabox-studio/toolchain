import type { TemplateAction } from './action.js';
import type { TemplateKind, TemplateVariable } from './template.js';

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
