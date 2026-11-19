import type { ProjectType } from '@deltabox/toolchain/shared';
import type { MonorepoWorkspace, TsconfigExtendsOptions } from '@deltabox/toolchain/tsconfig';

/** The replacement values a project scaffold understands. */
export interface ProjectContext {
    /** The project/package name (unscoped). */
    name: string;
    /** The npm scope, eg. `@acme`. */
    scope?: string;
    /** Package description. */
    description?: string;
    /** Package author. */
    author?: string;
    /** SPDX license id. */
    license?: string;
    /** Project homepage. */
    homepage?: string;
    /** Repository URL. */
    repo?: string;
    /** Repository URL (legacy alias for `repo`). */
    repoUrl?: string;
    /** Node engine range. */
    nodeVersion?: string;
    /** Package manager version. */
    packageManagerVersion?: string;
    /** Yarn version (legacy alias for `packageManagerVersion`). */
    yarnVersion?: string;
    /** Package manager name. */
    packageManager?: string;
    /** The project kind written into the scaffolded `dbx.config.ts`. */
    type?: ProjectType;
    /** The scaffold flavour (an application gets Vite entry files/scripts). */
    kind?: 'project' | 'application';
    /** Write `fmt.oxc` / `lint.oxc` defaults (and the Oxc config files). */
    oxc?: boolean;
    /**
     * Oxc config files already present above the scaffold root. The matching
     * local file + `dbx.config.ts` opt-in are omitted so the root owns them.
     */
    rootOxc?: RootOxcFiles;
    /** Write a `dbx.config.ts` (default true). */
    includeConfig?: boolean;
    /** Per-file `extends` overrides for the scaffolded tsconfig templates. */
    tsconfigExtends?: TsconfigExtendsOptions;
    /** Extra runtime dependencies merged into `dependencies`. */
    dependencies?: Record<string, string>;
    /** Extra dev dependencies merged over the scaffold's toolchain ones. */
    extraDevDependencies?: Record<string, string>;
    /** Scripts merged over (or replacing) the scaffold's default scripts. */
    scripts?: Record<string, string>;
}

/** Oxc config files found in an ancestor of a scaffold output directory. */
export interface RootOxcFiles {
    fmt: boolean;
    lint: boolean;
}

/** The language a generated `dbx.config.*` uses. */
export type ConfigLanguage = 'ts' | 'js';

/** The extensions a generated `dbx.config.*` can use. */
export type ConfigExtension = 'ts' | 'mts' | 'js' | 'mjs' | 'cjs';

export interface PluginViteConfigOptions {
    ctx: ProjectContext;
    type: ProjectType;
    /** `defaults` writes `fmt: { oxc: true }`; `inherit` opts into a parent. */
    fmt?: 'defaults' | 'inherit' | false;
    lint?: 'defaults' | 'inherit' | false;
    catalogs?: Record<string, string>;
    flavor?: 'application' | 'library' | 'monorepo-root' | 'workspace';
}

export interface MonorepoRootContext extends ProjectContext {
    /** The workspaces to wire into the monorepo tsconfig. */
    workspaces: MonorepoWorkspace[];
    /** The workspace globs (default `['packages/*']`). */
    workspaceGlobs?: string[];
}

export interface WorkspaceContext extends ProjectContext {
    /** The workspace name (unscoped), eg. `core`. */
    wsName: string;
    /** The workspace directory relative to the root, eg. `packages/core`. */
    wsDir: string;
    /** Reference the root catalog for dev deps (`catalog:`) instead of pinning. */
    useCatalog?: boolean;
}

export interface WriteGeneratedFilesOptions {
    /** Overwrite files that already exist (default false). */
    force?: boolean;
    /**
     * Validate the targets (containment, duplicates, overwrites) without writing.
     * Used to preflight a scaffold plus its Docker artifacts together.
     */
    dryRun?: boolean;
}
