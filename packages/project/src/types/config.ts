import type { ProjectType } from '@deltabox/toolchain/shared';

import type { ConfigExtension, ConfigLanguage } from './typescript.js';

export interface GenerateProjectConfigsOptions {
    /** Root to scan for projects. */
    root: string;
    /** Keep only projects matching one of these patterns (glob or substring). */
    include?: string[];
    /** Drop projects matching any of these patterns (glob or substring). */
    exclude?: string[];
    /** Force a project type instead of detecting it. */
    type?: ProjectType;
    /** Overwrite existing config files (default: skip projects that have one). */
    force?: boolean;
    /** Maximum directory depth to scan (default 5). */
    maxDepth?: number;
    /** Report what would be written without writing anything. */
    dryRun?: boolean;
    /** Only write the project graph; do not create `dbx.config.*` files. */
    skipConfig?: boolean;
    /** Language for new configs (default `ts`). */
    language?: ConfigLanguage;
    /** Force a config extension instead of inferring it from the language. */
    extension?: ConfigExtension;
}

/** One project considered for config generation. */
export interface GeneratedProjectConfig {
    /** Absolute project directory. */
    dir: string;
    /** Directory relative to the root (posix). */
    rel: string;
    /** Package name when available. */
    name?: string;
    /** The resolved project type. */
    type: ProjectType;
    /** The config file path (absolute). */
    configPath: string;
    /** Whether the config was (or would be) written. */
    created: boolean;
    /** The chosen config extension. */
    extension: ConfigExtension;
    /** Why the project was skipped, when it was. */
    skipped?: string;
    /** An old config removed when switching extension with `force`. */
    removed?: string;
    /** How an existing hand-written `vite.config.*` was handled. */
    vite?: { path: string; folded: boolean; error?: string };
}

export interface GenerateProjectConfigsResult {
    configs: GeneratedProjectConfig[];
    /** Project dirs whose config was (or would be) written. */
    created: string[];
    /** Project dirs skipped (already configured, or config writing disabled). */
    skipped: string[];
    dryRun: boolean;
    /** The written `.dbx/toolchain/projects.json` path (when not a dry run). */
    graphPath?: string;
}
