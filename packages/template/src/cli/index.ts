import fs from 'node:fs';
import path from 'node:path';

import { cancel, confirm, isCancel, select, text } from '@clack/prompts';

import {
    addGlobalProviderRegistry,
    addProjectProviderRegistry,
    removeGlobalProviderRegistry,
    removeProjectProviderRegistry,
    setGlobalProviderRegistries,
    setProjectProviderRegistries,
} from '@deltabox/toolchain-core';
import { logger, type ToolchainCommand } from '@deltabox/toolchain-shared';

import {
    addGlobalSource,
    addGlobalTemplate,
    addProjectRegistry,
    defaultGlobalTemplatesDir,
    expandHome,
    listRegistries,
    loadGlobalTemplates,
    normalizeSearchPaths,
    readGlobalCliConfig,
    removeGlobalTemplate,
    removeProjectRegistry,
    resolveTemplateSearchPaths,
    writeGlobalCliConfig,
    writeProjectRegistries,
    writeVscodeSearchPaths,
} from '../global.js';
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
                { flags: '--global', description: 'Only the global registry templates.' },
                KIND_OPTION,
                {
                    flags: '--registry',
                    description: 'List only the .dbx/toolchain/templates.json sources.',
                },
                { flags: '--json', description: 'Print the templates as JSON.' },
            ],
            run: async (opts, context) => {
                const cwd = (opts.cwd as string | undefined) ?? context.cwd;
                if (opts.global) {
                    const global = await loadGlobalTemplates(cwd);
                    if (opts.json) {
                        logger.raw(JSON.stringify(global.templates.map(toJson), null, 4));
                        return;
                    }
                    if (global.templates.length === 0) {
                        logger.info('no global templates found.');
                        return;
                    }
                    for (const template of global.templates)
                        logger.info(`  ${template.id.padEnd(24)} ${template.name}`);
                    return;
                }
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
                {
                    flags: '--no-global',
                    description: 'Do not also store the template in the global registry.',
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
                    if (opts.global !== false) {
                        try {
                            addGlobalTemplate(dir, path.basename(dir));
                        } catch (error) {
                            logger.warn(`could not add the template globally: ${String(error)}`);
                        }
                    }
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
                    description: 'Force: builtin | local | npm | git | vite-plus | remote.',
                },
                { flags: '--name <name>', description: 'Display name.' },
                KIND_OPTION,
                { flags: '--ref <ref>', description: 'Git branch/tag/commit.' },
                {
                    flags: '--registry <url>',
                    description: 'Custom npm registry (default: the project package manager).',
                },
                { flags: '--subdir <dir>', description: 'Subdirectory within the source.' },
                {
                    flags: '--no-global',
                    description: 'Do not also register the source in the global registry.',
                },
                { flags: '--json', description: 'Print the updated registry as JSON.' },
            ],
            run: (opts, context) => {
                const source = parseSourceSpec(String(opts.source), context.cwd);
                if (opts.type) source.type = opts.type as typeof source.type;
                if (opts.name) source.name = String(opts.name);
                if (opts.kind) source.kind = opts.kind as NonNullable<typeof source.kind>;
                if (opts.ref) source.ref = String(opts.ref);
                if (opts.registry) source.registry = String(opts.registry);
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
                if (opts.global !== false) {
                    try {
                        if (source.type === 'local')
                            addGlobalTemplate(
                                source.locate,
                                source.id ?? path.basename(source.locate)
                            );
                        else addGlobalSource(source);
                    } catch (error) {
                        logger.warn(`could not register the source globally: ${String(error)}`);
                    }
                }
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
            options: [
                CWD_OPTION,
                { flags: '--global', description: 'Remove the template from the global registry.' },
                { flags: '--json', description: 'Print the registry as JSON.' },
            ],
            run: (opts, context) => {
                if (opts.global) {
                    const removed = removeGlobalTemplate(String(opts.id));
                    if (opts.json) {
                        logger.raw(JSON.stringify({ removed }, null, 4));
                        return;
                    }
                    if (!removed) {
                        logger.error(`no global template matching "${opts.id}".`);
                        process.exitCode = 1;
                        return;
                    }
                    logger.info(`removed global template "${opts.id}".`);
                    return;
                }
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
            name: 'template:registry',
            description:
                'Manage the global template search paths (and sync them to the VS Code setting).',
            options: [
                { flags: '--list', description: 'List the resolved search paths (default).' },
                { flags: '--add <path...>', description: 'Add global search path(s).' },
                { flags: '--remove <path...>', description: 'Remove global search path(s).' },
                { flags: '--set <path...>', description: 'Replace the global search paths.' },
                { flags: '--clear', description: 'Reset the global search paths to the default.' },
                {
                    flags: '--vscode-dir <dir>',
                    description: 'Record the VS Code user dir (its settings.json holds the paths).',
                },
                { flags: '--json', description: 'Print the resolved config as JSON.' },
            ],
            run: opts => {
                let cli = readGlobalCliConfig();
                if (opts.vscodeDir) {
                    cli = writeGlobalCliConfig({ vscodeDir: String(opts.vscodeDir) });
                }

                const current = resolveTemplateSearchPaths();
                let paths = current.paths;
                if (opts.clear) paths = [defaultGlobalTemplatesDir()];
                if (opts.set) paths = normalizeSearchPaths(opts.set as string[]);
                if (opts.add) paths = normalizeSearchPaths([...paths, ...(opts.add as string[])]);
                if (opts.remove) {
                    const removed = new Set(normalizeSearchPaths(opts.remove as string[]));
                    paths = paths.filter(entry => !removed.has(entry));
                }
                const changed = Boolean(opts.clear || opts.set || opts.add || opts.remove);
                if (changed) {
                    cli = writeGlobalCliConfig({ registrySearchPaths: paths });
                    if ((opts.set || opts.add || opts.remove) && cli.vscodeDir)
                        writeVscodeSearchPaths(cli.vscodeDir, paths);
                }

                const result = {
                    paths,
                    source: changed ? 'cli' : current.source,
                    defaultDir: defaultGlobalTemplatesDir(),
                    ...(cli.vscodeDir ? { vscodeDir: cli.vscodeDir } : {}),
                };
                if (opts.json) {
                    logger.raw(JSON.stringify(result, null, 4));
                    return;
                }
                logger.info(`global templates dir: ${defaultGlobalTemplatesDir()}`);
                for (const entry of paths) logger.info(`  ${entry}`);
                if (cli.vscodeDir) logger.info(`VS Code user dir: ${cli.vscodeDir}`);
                if (changed) logger.info('updated the CLI config and VS Code setting.');
            },
        },
        {
            name: 'registry',
            description: 'List or manage the template/provider registries.',
            options: [
                CWD_OPTION,
                {
                    flags: '--kind <kind>',
                    description: 'What --add/--remove manages: templates | providers.',
                },
                { flags: '--add <path>', description: 'Add a registry path (or remote URL).' },
                { flags: '--remove <path>', description: 'Remove a registry path.' },
                { flags: '--set <path...>', description: 'Replace the registry search paths.' },
                { flags: '--clear', description: 'Clear the registry search paths.' },
                { flags: '--scope <scope>', description: 'project | global (default: global).' },
                { flags: '--json', description: 'Print the registries as JSON.' },
            ],
            run: (opts, context) => {
                const cwd = (opts.cwd as string | undefined) ?? context.cwd;
                const scope = (opts.scope as string | undefined) ?? 'global';
                const kind = (opts.kind as string | undefined) ?? 'templates';
                const change = (opts.add ?? opts.remove) as string | undefined;
                if (opts.set || opts.clear) {
                    const next = opts.clear ? [] : normalizeSearchPaths(opts.set as string[]);
                    if (kind === 'providers') {
                        if (scope === 'global') setGlobalProviderRegistries(next);
                        else setProjectProviderRegistries(cwd, next);
                    } else if (scope === 'global') {
                        writeGlobalCliConfig({ registrySearchPaths: next });
                    } else {
                        writeProjectRegistries(cwd, next);
                    }
                } else if (change) {
                    if (kind === 'providers') {
                        if (scope === 'global') {
                            if (opts.add) addGlobalProviderRegistry(change);
                            else removeGlobalProviderRegistry(change);
                        } else if (opts.add) {
                            addProjectProviderRegistry(cwd, change);
                        } else {
                            removeProjectProviderRegistry(cwd, change);
                        }
                    } else if (scope === 'global') {
                        const cli = readGlobalCliConfig();
                        const target = expandHome(change);
                        const paths = normalizeSearchPaths(cli.registrySearchPaths);
                        const next = opts.add
                            ? [...new Set([...paths, target])]
                            : paths.filter(entry => entry !== target);
                        writeGlobalCliConfig({ registrySearchPaths: next });
                    } else if (opts.add) {
                        addProjectRegistry(cwd, change);
                    } else {
                        removeProjectRegistry(cwd, change);
                    }
                }

                const result = listRegistries(cwd);
                if (opts.json) {
                    logger.raw(JSON.stringify(result, null, 4));
                    return;
                }
                for (const [kind, entries] of Object.entries(result)) {
                    logger.info(kind);
                    for (const entry of entries)
                        logger.info(
                            `  [${entry.scope}${entry.remote ? ', remote' : ''}] ${entry.path}`
                        );
                }
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
