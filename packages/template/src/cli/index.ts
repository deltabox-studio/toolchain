import fs from 'node:fs';
import path from 'node:path';

import { cancel, confirm, isCancel, select, text } from '@clack/prompts';

import { logger, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { TEMPLATE_MANIFEST, writeTemplateManifest } from '../local.js';
import { parseSourceSpec } from '../online.js';
import {
    addTemplateSource,
    loadTemplates,
    readTemplateRegistry,
    removeTemplateSource,
} from '../registry.js';
import { scaffoldTemplate } from '../scaffold.js';
import type { Template, TemplateKind, TemplateManifest, TemplateVariable } from '../types.js';

const CWD_OPTION = { flags: '--cwd <dir>', description: 'Project root (default: cwd).' };
const KIND_OPTION = {
    flags: '--kind <kind>',
    description: 'project | workspace | application | folder | tooling | pipeline.',
};

/** A JSON-friendly view of a template (drops functions + the local dir). */
function toJson(template: Template): Record<string, unknown> {
    return {
        id: template.id,
        name: template.name,
        ...(template.description ? { description: template.description } : {}),
        kind: template.kind,
        type: template.source.type,
        online: Boolean(template.online),
        ...(template.tags ? { tags: template.tags } : {}),
        ...(template.variables ? { variables: template.variables } : {}),
        ...(template.actions ? { actions: template.actions } : {}),
    };
}

/** Parse repeated `--var key=value` flags into a record. */
function parseVars(pairs: string[] | undefined): Record<string, string> {
    const vars: Record<string, string> = {};
    for (const pair of pairs ?? []) {
        const index = pair.indexOf('=');
        if (index === -1) continue;
        vars[pair.slice(0, index)] = pair.slice(index + 1);
    }
    return vars;
}

/** Parse repeated `--var name[:default]` flags into template variables. */
function parseVarDefs(pairs: string[] | undefined): TemplateVariable[] {
    return (pairs ?? []).map(pair => {
        const index = pair.indexOf(':');
        if (index === -1) return { name: pair };
        return { name: pair.slice(0, index), default: pair.slice(index + 1) };
    });
}

/** Whether interactive prompts are possible (a TTY, and not machine output). */
function canPrompt(opts: Record<string, unknown>): boolean {
    return Boolean(process.stdin.isTTY && process.stdout.isTTY) && opts.json !== true;
}

/** Print a clack cancel line and mark the run as failed. */
function abortPrompt(): void {
    cancel('Cancelled.');
    process.exitCode = 1;
}

/** The `template:*` commands plus the template-driven `create`. */
export function templateCommands(): ToolchainCommand[] {
    return [
        {
            name: 'template:list',
            description: 'List templates (builtin + local + opted-in online sources).',
            options: [
                CWD_OPTION,
                { flags: '--online', description: 'Resolve online sources (npm/git).' },
                { flags: '--offline', description: 'Force offline (skip npm/git).' },
                KIND_OPTION,
                {
                    flags: '--registry',
                    description: 'List only the .dbx/toolchain/templates.json sources.',
                },
                { flags: '--json', description: 'Print the templates as JSON.' },
            ],
            run: async (opts, context) => {
                const cwd = (opts.cwd as string | undefined) ?? context.cwd;
                if (opts.registry) {
                    const sources = readTemplateRegistry(cwd).sources;
                    if (opts.json) {
                        logger.raw(
                            JSON.stringify(
                                sources.map(source => ({
                                    key: `${source.type}:${source.locate}`,
                                    ...source,
                                })),
                                null,
                                4
                            )
                        );
                        return;
                    }
                    if (sources.length === 0) {
                        logger.info('the template registry is empty.');
                        return;
                    }
                    for (const source of sources)
                        logger.info(
                            `  ${`${source.type}:${source.locate}`.padEnd(40)} ${source.name ?? source.id ?? ''}`
                        );
                    return;
                }
                const online = Boolean(opts.online) && !opts.offline;
                const templates = await loadTemplates({ cwd, config: context.config, online });
                const kind = opts.kind as string | undefined;
                const filtered = kind
                    ? templates.filter(template => template.kind === kind)
                    : templates;
                if (opts.json) {
                    logger.raw(JSON.stringify(filtered.map(toJson), null, 4));
                    return;
                }
                if (filtered.length === 0) {
                    logger.info('no templates found.');
                    return;
                }
                for (const template of filtered) {
                    const flags = [
                        template.kind,
                        template.source.type,
                        template.online ? 'online' : 'offline',
                    ].join(', ');
                    logger.info(
                        `  ${template.id.padEnd(24)} ${template.name}  [${flags}]${template.description ? `\n    ${template.description}` : ''}`
                    );
                }
            },
        },
        {
            name: 'template:init',
            description: 'Write a template.json to a directory, making it a local template.',
            args: [{ name: 'dir', description: 'Directory (default: cwd).', required: false }],
            options: [
                CWD_OPTION,
                KIND_OPTION,
                { flags: '--name <name>', description: 'Display name (default: folder name).' },
                { flags: '--description <text>', description: 'Description.' },
                {
                    flags: '--var <pair...>',
                    description: 'Variable name[:default] (repeatable).',
                },
                { flags: '--tag <tag...>', description: 'Tag (repeatable).' },
                { flags: '--force', description: 'Overwrite an existing template.json.' },
                {
                    flags: '--add',
                    description: 'Also record the folder in .dbx/toolchain/templates.json.',
                },
                { flags: '--json', description: 'Print the manifest as JSON.' },
            ],
            run: (opts, context) => {
                const dir = path.resolve(context.cwd, String(opts.dir ?? '.'));
                const file = path.join(dir, TEMPLATE_MANIFEST);
                if (fs.existsSync(file) && !opts.force) {
                    throw new Error(`template.json already exists at ${file} (use --force).`);
                }
                const variables = parseVarDefs(opts.var as string[] | undefined);
                const manifest: TemplateManifest = {
                    name: String(opts.name ?? path.basename(dir)),
                    kind: (opts.kind as TemplateKind | undefined) ?? 'folder',
                    ...(opts.description ? { description: String(opts.description) } : {}),
                    ...(variables.length ? { variables } : {}),
                    ...(opts.tag ? { tags: opts.tag as string[] } : {}),
                };
                writeTemplateManifest(dir, manifest);
                if (opts.add) {
                    addTemplateSource(context.cwd, {
                        type: 'local',
                        locate: dir,
                        kind: manifest.kind,
                    });
                }
                if (opts.json) {
                    logger.raw(JSON.stringify(manifest, null, 4));
                    return;
                }
                logger.info(`wrote ${file}`);
                if (opts.add) logger.info('registered the folder as a template.');
            },
        },
        {
            name: 'template:add',
            description: 'Record a template source in .dbx/toolchain/templates.json.',
            args: [
                {
                    name: 'source',
                    description: 'local path | git URL | @scope/create | type:locate',
                },
            ],
            options: [
                CWD_OPTION,
                {
                    flags: '--type <type>',
                    description: 'Force: builtin | local | npm | git | vite-plus.',
                },
                { flags: '--name <name>', description: 'Display name.' },
                KIND_OPTION,
                { flags: '--ref <ref>', description: 'Git branch/tag/commit.' },
                { flags: '--subdir <dir>', description: 'Subdirectory within the source.' },
                { flags: '--json', description: 'Print the updated registry as JSON.' },
            ],
            run: (opts, context) => {
                const source = parseSourceSpec(String(opts.source), context.cwd);
                if (opts.type) source.type = opts.type as typeof source.type;
                if (opts.name) source.name = String(opts.name);
                if (opts.kind) source.kind = opts.kind as NonNullable<typeof source.kind>;
                if (opts.ref) source.ref = String(opts.ref);
                if (opts.subdir) source.subdir = String(opts.subdir);
                // A local folder without a template.json is initialised first, so
                // `template:add ./dir` "just works".
                if (
                    source.type === 'local' &&
                    !fs.existsSync(path.join(source.locate, TEMPLATE_MANIFEST))
                ) {
                    writeTemplateManifest(source.locate, {
                        name: source.name ?? path.basename(source.locate),
                        kind: (opts.kind as TemplateKind | undefined) ?? 'folder',
                    });
                }
                const registry = addTemplateSource(context.cwd, source);
                if (opts.json) {
                    logger.raw(JSON.stringify(registry, null, 4));
                    return;
                }
                logger.info(
                    `added ${source.type}:${source.locate} (${registry.sources.length} source(s)).`
                );
            },
        },
        {
            name: 'template:remove',
            description: 'Remove a source from .dbx/toolchain/templates.json.',
            args: [{ name: 'id', description: 'Source id or type:locate.' }],
            options: [CWD_OPTION, { flags: '--json', description: 'Print the registry as JSON.' }],
            run: (opts, context) => {
                const { registry, removed } = removeTemplateSource(context.cwd, String(opts.id));
                if (opts.json) {
                    logger.raw(JSON.stringify(registry, null, 4));
                    return;
                }
                if (removed === 0) {
                    logger.error(`no source matching "${opts.id}".`);
                    process.exitCode = 1;
                    return;
                }
                logger.info(`removed ${removed} source(s) (${registry.sources.length} left).`);
            },
        },
        {
            name: 'template:info',
            description: 'Show one template by id.',
            args: [{ name: 'id', description: 'The template id.' }],
            options: [
                CWD_OPTION,
                { flags: '--online', description: 'Resolve online sources.' },
                { flags: '--json', description: 'Print the template as JSON (the default).' },
            ],
            run: async (opts, context) => {
                const cwd = (opts.cwd as string | undefined) ?? context.cwd;
                const templates = await loadTemplates({
                    cwd,
                    config: context.config,
                    online: Boolean(opts.online),
                });
                const template = templates.find(candidate => candidate.id === opts.id);
                if (!template) {
                    logger.error(`unknown template "${opts.id}".`);
                    process.exitCode = 1;
                    return;
                }
                logger.raw(JSON.stringify(toJson(template), null, 4));
            },
        },
        {
            name: 'create',
            description: 'Scaffold a project from a template (builtin, local or Vite+).',
            options: [
                { flags: '-t, --template <id>', description: 'Template id (see template:list).' },
                KIND_OPTION,
                { flags: '-n, --name <name>', description: 'Project / package name.' },
                { flags: '-s, --scope <scope>', description: 'npm scope, eg. @acme.' },
                { flags: '-o, --out <dir>', description: 'Output directory (default: cwd).' },
                CWD_OPTION,
                {
                    flags: '--var <pair...>',
                    description: 'Template variables as key=value (repeatable).',
                },
                {
                    flags: '--action <id...>',
                    description: 'Action id to run after scaffolding (repeatable).',
                },
                { flags: '--online', description: 'Resolve online templates too.' },
                { flags: '--json', description: 'Print the result as JSON.' },
            ],
            run: async (opts, context) => {
                const out = (opts.out as string | undefined) ?? context.cwd;
                const kind = opts.kind as string | undefined;
                const templates = await loadTemplates({
                    cwd: context.cwd,
                    config: context.config,
                    online: true,
                });

                // Prompt for anything the flags left out (interactive terminals only).
                const interactive = canPrompt(opts as Record<string, unknown>);
                let id = String(opts.template ?? '');
                let name = opts.name as string | undefined;
                let scope = opts.scope as string | undefined;

                if (interactive && !id && !kind) {
                    if (templates.length === 0) {
                        throw new Error(
                            'No templates available. Pass --template <id> (see `dbx template:list`).'
                        );
                    }
                    const picked = await select({
                        message: 'Pick a template',
                        options: templates.map(t => ({
                            value: t.id,
                            label: t.name,
                            ...(t.description ? { hint: t.description } : {}),
                        })),
                    });
                    if (isCancel(picked)) return abortPrompt();
                    id = String(picked);
                }
                if (interactive && !name) {
                    const answer = await text({
                        message: 'Project name',
                        placeholder: context.config.project?.name ?? 'app',
                        defaultValue: context.config.project?.name ?? 'app',
                    });
                    if (isCancel(answer)) return abortPrompt();
                    name = String(answer);
                }
                if (interactive && !scope) {
                    const answer = await text({
                        message: 'npm scope (optional)',
                        placeholder: context.config.project?.scope ?? `@${name ?? 'app'}`,
                    });
                    if (isCancel(answer)) return abortPrompt();
                    scope = String(answer) || undefined;
                }

                let template = templates.find(candidate => candidate.id === id);
                // With no explicit id, a `--kind` picks the first matching template.
                if (!template && !id && kind) {
                    template = templates.find(candidate => candidate.kind === kind);
                }
                if (!template && id) {
                    // An unlisted id is treated as a Vite+ template (`vp create <id>`).
                    template = {
                        id,
                        name: id,
                        kind: (kind as TemplateKind | undefined) ?? 'project',
                        source: { type: 'vite-plus', locate: id },
                        online: true,
                    };
                }
                if (!template) {
                    throw new Error(
                        'No template selected. Pass --template <id> or --kind <kind> (see `dbx template:list`).'
                    );
                }
                // A name of `.` means "use the directory I am being created in".
                if (name === '.') name = path.basename(path.resolve(out));
                const tokens = {
                    ...context.config.project,
                    name: name ?? context.config.project?.name ?? 'app',
                    ...(scope ? { scope } : {}),
                };
                const variables = parseVars(opts.var as string[] | undefined);
                const actions = new Set<string>((opts.action as string[] | undefined) ?? []);

                // Prompt for the template's own inputs (everything except the
                // standard `name`/`scope`, which are handled above, and any value
                // already supplied with `--var`). This is the same input pipeline
                // for builtin, local and online templates.
                if (interactive) {
                    for (const variable of template.variables ?? []) {
                        if (variable.name === 'name' || variable.name === 'scope') continue;
                        if (variables[variable.name] !== undefined) continue;
                        const message = variable.prompt ?? variable.name;
                        if (variable.options && variable.options.length > 0) {
                            const picked = await select({
                                message,
                                options: variable.options.map(option => ({
                                    value: option,
                                    label: option,
                                })),
                                ...(variable.default ? { initialValue: variable.default } : {}),
                            });
                            if (isCancel(picked)) return abortPrompt();
                            variables[variable.name] = String(picked);
                        } else {
                            const answer = await text({
                                message,
                                ...(variable.default
                                    ? {
                                          placeholder: variable.default,
                                          defaultValue: variable.default,
                                      }
                                    : {}),
                            });
                            if (isCancel(answer)) return abortPrompt();
                            const value = String(answer ?? '');
                            variables[variable.name] = value || (variable.default ?? '');
                        }
                    }

                    // Opt-in post-scaffold actions (eg. Install dependencies?).
                    for (const action of template.actions ?? []) {
                        if (actions.has(action.id)) continue;
                        const answer = await confirm({
                            message: action.prompt ?? `Run ${action.id}?`,
                            initialValue: action.default ?? false,
                        });
                        if (isCancel(answer)) return abortPrompt();
                        if (answer) actions.add(action.id);
                    }
                }

                const result = await scaffoldTemplate(template, {
                    cwd: out,
                    tokens,
                    variables,
                    actions: [...actions],
                });

                if (opts.json) {
                    logger.raw(JSON.stringify({ template: template.id, out, ...result }, null, 4));
                    return;
                }
                if (
                    template.source.type === 'vite-plus' ||
                    template.source.type === 'npm' ||
                    template.source.type === 'git'
                ) {
                    if (result.code) process.exitCode = result.code;
                    return;
                }
                for (const file of result.written) logger.info(`Created ${file}`);
            },
        },
    ];
}
