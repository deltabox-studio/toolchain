import { applyReplacementsDeep, type Replacements } from '@deltabox/toolchain-shared';

import baseTemplate from './templates/tsconfig.base.json' with { type: 'json' };
import buildTemplate from './templates/tsconfig.build.json' with { type: 'json' };
import defaultTemplate from './templates/tsconfig.default.json' with { type: 'json' };

/** The static tsconfig templates (with `{{envTypesFile}}` tokens). */
export const tsconfigBaseTemplate: Record<string, unknown> = baseTemplate;
export const tsconfigDefaultTemplate: Record<string, unknown> = defaultTemplate;
export const tsconfigBuildTemplate: Record<string, unknown> = buildTemplate;

/** The default replacement values for the tsconfig templates. */
export const DEFAULT_TSCONFIG_REPLACEMENTS: Replacements = { envTypesFile: 'src/env.d.ts' };

/** The `extends` value to write into one generated template. */
export type TsconfigExtends = string | string[] | false;

/** Per-template `extends` overrides for {@link renderTsconfigTemplates}. */
export interface TsconfigExtendsOptions {
    base?: TsconfigExtends;
    default?: TsconfigExtends;
    build?: TsconfigExtends;
}

function withExtends(
    template: Record<string, unknown>,
    extendsValue: TsconfigExtends | undefined
): Record<string, unknown> {
    if (extendsValue === undefined) return template;
    const next = { ...template };
    if (extendsValue === false) delete next.extends;
    else next.extends = extendsValue;
    return next;
}

export function renderTsconfigBase(
    replacements: Replacements = {},
    extendsValue?: TsconfigExtends
): string {
    return `${JSON.stringify(
        applyReplacementsDeep(withExtends(tsconfigBaseTemplate, extendsValue), {
            ...DEFAULT_TSCONFIG_REPLACEMENTS,
            ...replacements,
        }),
        null,
        4
    )}\n`;
}

export function renderTsconfigDefault(
    replacements: Replacements = {},
    extendsValue?: TsconfigExtends
): string {
    return `${JSON.stringify(
        applyReplacementsDeep(withExtends(tsconfigDefaultTemplate, extendsValue), {
            ...DEFAULT_TSCONFIG_REPLACEMENTS,
            ...replacements,
        }),
        null,
        4
    )}\n`;
}

export function renderTsconfigBuild(
    replacements: Replacements = {},
    extendsValue?: TsconfigExtends
): string {
    return `${JSON.stringify(
        applyReplacementsDeep(withExtends(tsconfigBuildTemplate, extendsValue), {
            ...DEFAULT_TSCONFIG_REPLACEMENTS,
            ...replacements,
        }),
        null,
        4
    )}\n`;
}

/** A workspace entry for the generated monorepo tsconfig. */
export interface MonorepoWorkspace {
    /** The path alias suffix, eg. `server` -> `@scope/server`. */
    alias: string;
    /** The workspace directory relative to the repo root, eg. `packages/server`. */
    dir: string;
}

export interface MonorepoTsconfigOptions {
    /** The npm scope, eg. `@acme` (used as the alias prefix). */
    scope: string;
    /** The workspaces to wire into `paths` + `references`. */
    workspaces: MonorepoWorkspace[];
    /** Extra compiler options to merge in. */
    compilerOptions?: Record<string, unknown>;
    /** Enable `composite` for the generated monorepo config (default true). */
    composite?: boolean;
}

/** Build a project-references + path-aliases `tsconfig.workspaces.json` object. */
export function buildMonorepoTsconfig(options: MonorepoTsconfigOptions): Record<string, unknown> {
    const paths: Record<string, string[]> = {};
    const references: { path: string }[] = [];
    for (const ws of options.workspaces) {
        paths[`${options.scope}/${ws.alias}`] = [`./${ws.dir}/src/index.ts`];
        paths[`${options.scope}/${ws.alias}/*`] = [`./${ws.dir}/src/*`];
        references.push({ path: `./${ws.dir}/tsconfig.json` });
    }
    return {
        compilerOptions: {
            composite: options.composite ?? true,
            types: ['node'],
            allowJs: true,
            noEmit: false,
            declaration: true,
            emitDeclarationOnly: true,
            ...options.compilerOptions,
            paths,
        },
        references,
    };
}

/** Render the monorepo tsconfig as JSON text. */
export function renderMonorepoTsconfig(options: MonorepoTsconfigOptions): string {
    return `${JSON.stringify(buildMonorepoTsconfig(options), null, 4)}\n`;
}

/** Render every tsconfig template, keyed by file name. */
export function renderTsconfigTemplates(
    replacements: Replacements = {},
    extendsOptions: TsconfigExtendsOptions = {}
): Record<string, string> {
    return {
        'tsconfig.base.json': renderTsconfigBase(replacements, extendsOptions.base),
        'tsconfig.default.json': renderTsconfigDefault(replacements, extendsOptions.default),
        'tsconfig.build.json': renderTsconfigBuild(replacements, extendsOptions.build),
    };
}
