/**
 * Help grouping for the `dbx` CLI.
 *
 * The root program mirrors the docs sidebar: core workspace commands stay in
 * the default `Commands:` section, while project/template, tooling, automation,
 * agent and Vite+ commands get their own headings. Option groups follow the same
 * idea inside each command's `Options:` sections.
 *
 * Grouping is presentation-only; it never changes command names or parsing.
 */

import type { CliCommand, CliOption } from '@deltabox/toolchain/shared';

/** Explicit command groups (Vite+ commands are matched by prefix below). */
const COMMAND_GROUPS: Record<string, string> = {
    // Project & templates
    create: 'Project & templates',
    registry: 'Project & templates',
    'project:init': 'Project & templates',
    'project:init:monorepo': 'Project & templates',
    'project:init:workspace': 'Project & templates',
    'project:config': 'Project & templates',
    'template:list': 'Project & templates',
    'template:init': 'Project & templates',
    'template:add': 'Project & templates',
    'template:remove': 'Project & templates',
    'template:registry': 'Project & templates',
    'template:info': 'Project & templates',

    // Tooling
    tsconfig: 'Tooling',
    fmt: 'Tooling',
    lint: 'Tooling',
    cleanup: 'Tooling',
    'cleanup:turbo': 'Tooling',
    migrate: 'Tooling',
    'migrate:list': 'Tooling',

    // Automation
    changelog: 'Automation & API',
    workflow: 'Automation & API',

    // Agents
    'mcp:serve': 'Agents',
    'mcp:install': 'Agents',
    'mcp:list': 'Agents',
    skills: 'Agents',
};

type OptionGroupRule = readonly [pattern: RegExp, group: string];

/** Per-command option groups, matched against the option's long flag. */
const OPTION_GROUPS: Record<string, readonly OptionGroupRule[]> = {
    projects: [
        [/^--(?:cwd|max-depth)$/, 'Scan'],
        [/^--(?:no-write|json)$/, 'Output'],
    ],
    sync: [
        [/^--(?:cwd|quiet|configless)$/, 'Workspace'],
        [/^--(?:check|watch|recursive|force)$/, 'Sync'],
        [/^--only$/, 'Tasks'],
        [/^--(?:no-)?format/, 'Formatting'],
        [/^--json$/, 'Output'],
    ],
    watch: [
        [/^--(?:cwd|quiet|configless)$/, 'Workspace'],
        [/^--(?:force|list)$/, 'Watch'],
        [/^--json$/, 'Output'],
    ],
    reset: [
        [/^--(?:cwd|recursive|include|exclude)$/, 'Scope'],
        [/^--(?:generated|manifest|config|all)$/, 'Selection'],
        [/^--(?:dry-run|json)$/, 'Output'],
    ],
    cleanup: [[/^--(?:cwd|pattern)$/, 'Cleanup']],
    'cleanup:turbo': [[/^--cwd$/, 'Cleanup']],
    providers: [[/^--json$/, 'Output']],
    enabled: [[/^--json$/, 'Output']],
    enable: [
        [/^--(?:global|workspace|cwd)$/, 'Scope'],
        [/^--json$/, 'Output'],
    ],
    disable: [
        [/^--(?:global|workspace|cwd)$/, 'Scope'],
        [/^--json$/, 'Output'],
    ],
    changelog: [
        [/^--(?:range|version|base-version|processing-method)$/, 'Range'],
        [/^--(?:release|no-release)/, 'Release'],
        [/^--(?:intro|outro)/, 'Text'],
        [/^--(?:format-only|release-body-wrap|no-package-changes-section)$/, 'Formatting'],
        [/^--dry-run$/, 'Output'],
    ],
    workflow: [
        [/^--(?:cwd|ref)$/, 'Target'],
        [/^--(?:gh|glab|az)$/, 'Vendors'],
        [/^--(?:list|json)$/, 'Output'],
    ],
    migrate: [
        [/^--(?:from|to|target)$/, 'Migration'],
        [/^--(?:cwd|recursive)$/, 'Scope'],
        [/^--(?:write|dry-run|check)$/, 'Write'],
        [/^--(?:online|ignore-|tool-version)/, 'Advanced'],
        [/^--json$/, 'Output'],
    ],
    'mcp:serve': [[/^--cwd$/, 'Target']],
    'mcp:install': [
        [/^--(?:provider|scope|cwd|dir)$/, 'Target'],
        [/^--(?:command|no-skills)$/, 'Options'],
        [/^--json$/, 'Output'],
    ],
    'mcp:list': [
        [/^--cwd$/, 'Target'],
        [/^--json$/, 'Output'],
    ],
    skills: [
        [/^--(?:official|force)$/, 'Action'],
        [/^--(?:provider|scope|cwd|dir)$/, 'Target'],
        [/^--json$/, 'Output'],
    ],
    'project:init': [
        [/^--(?:name|scope|type)$/, 'Project'],
        [/^--(?:out|force|no-project-config|containerize)$/, 'Output'],
        [/^--(?:package-manager|tool-version)$/, 'Advanced'],
    ],
    'project:init:monorepo': [
        [/^--(?:name|scope|type|example)$/, 'Project'],
        [/^--(?:out|force|no-project-config|containerize)$/, 'Output'],
        [/^--(?:package-manager|tool-version)$/, 'Advanced'],
    ],
    'project:init:workspace': [
        [/^--(?:name|scope|type)$/, 'Project'],
        [/^--(?:root|dir)$/, 'Location'],
        [/^--(?:force|no-project-config)$/, 'Output'],
        [/^--(?:package-manager|tool-version)$/, 'Advanced'],
    ],
    'project:config': [
        [/^--(?:cwd|include|exclude|type)$/, 'Scan'],
        [/^--(?:language|config-extension|skip-config|force)$/, 'Generation'],
        [/^--(?:dry-run|json)$/, 'Output'],
    ],
    'template:list': [
        [/^--(?:online|offline|global|kind|registry)$/, 'Source'],
        [/^--cwd$/, 'Target'],
        [/^--json$/, 'Output'],
    ],
    'template:init': [
        [/^--(?:name|id|description)$/, 'Identity'],
        [/^--(?:var|tag)$/, 'Metadata'],
        [/^--(?:force|add|no-global)$/, 'Options'],
        [/^--json$/, 'Output'],
    ],
    'template:add': [
        [/^--(?:type|name|id|ref|registry|subdir)$/, 'Source'],
        [/^--no-global$/, 'Options'],
        [/^--json$/, 'Output'],
    ],
    'template:remove': [
        [/^--global$/, 'Scope'],
        [/^--json$/, 'Output'],
    ],
    'template:registry': [
        [/^--(?:list|add|remove|set|clear|vscode-dir)$/, 'Paths'],
        [/^--json$/, 'Output'],
    ],
    registry: [
        [/^--(?:kind|add|remove|set|clear|scope)$/, 'Registry'],
        [/^--json$/, 'Output'],
    ],
    'template:info': [
        [/^--online$/, 'Source'],
        [/^--json$/, 'Output'],
    ],
    create: [
        [/^--(?:var|action|online)$/, 'Template'],
        [/^--(?:force|containerize|json)$/, 'Output'],
        [/^--tool-version$/, 'Advanced'],
    ],
    tsconfig: [
        [/^--(?:auto|no-auto|auto-aliases|no-auto-aliases|auto-refs|no-auto-refs)$/, 'Auto-wiring'],
        [
            /^--(?:glob|exclude|no-gitignore|refs|composite|no-aliases|flatten-remote-extends|auto-src-dir|indent|root-file|default-file|build-file)$/,
            'Generation',
        ],
        [/^--(?:cwd|root|tsconfig|json|alias|paths|references|no-extends)$/, 'Inspection'],
        [/^--restore$/, 'Overrides'],
    ],
    fmt: [[/^--cwd$/, 'Target']],
    lint: [[/^--cwd$/, 'Target']],
};

/** The long flag of an option (`-o, --out <dir>` -> `--out`). */
function longFlag(option: CliOption): string | undefined {
    return option.flags
        .split(/[ ,|]+/)
        .map(token => token.trim())
        .find(token => token.startsWith('--'));
}

/** The explicit or derived help group for a command. */
function commandGroup(command: CliCommand): string | undefined {
    if (command.group) return command.group;
    if (command.name === 'vite' || command.name.startsWith('vite:')) return 'Vite+';
    return COMMAND_GROUPS[command.name];
}

/** The help group for one option of a command. */
function optionGroup(command: CliCommand, option: CliOption): string | undefined {
    if (option.group) return option.group;
    const flag = longFlag(option);
    if (!flag) return undefined;
    for (const [pattern, group] of OPTION_GROUPS[command.name] ?? []) {
        if (pattern.test(flag)) return group;
    }
    return undefined;
}

/** Apply the dogfood command/option groups without changing behavior. */
export function withDogfoodGroups<T extends readonly CliCommand[]>(commands: T): T {
    return commands.map(command => {
        const group = commandGroup(command);
        const options = command.options?.map(option => {
            const optionGroupName = optionGroup(command, option);
            return optionGroupName ? { ...option, group: optionGroupName } : option;
        });
        return {
            ...command,
            ...(group ? { group } : {}),
            ...(options ? { options } : {}),
        };
    }) as unknown as T;
}
