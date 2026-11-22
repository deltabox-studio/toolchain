/**
 * The official dbx toolchain skill.
 *
 * The skill is documentation-only: it points an agent at the published
 * `llms.txt` bundle so it reads the current docs before answering or editing.
 * Installation is additive and idempotent — an existing skill file is left
 * untouched unless `force` is set, so a user's edits are never overwritten by
 * accident.
 */

import fs from 'node:fs';
import path from 'node:path';

import { sectionConfig, sectionEnabled, type ToolchainConfig } from '@deltabox/toolchain/shared';

import {
    listMcpProviders,
    MCP_PROVIDERS,
    MCP_SKILL_NAME,
    renderSkill,
    type McpProvider,
    type McpProviderId,
    type McpScope,
} from './install.js';

/** The directory/file stem of the official documentation skill. */
export const OFFICIAL_SKILL_NAME = 'deltabox-toolchain';

/** The published documentation bundle the skill points an agent at. */
export const OFFICIAL_SKILL_DOCS_URL = 'https://toolchain.deltabox.studio/llms.txt';

/** A skill flavor: the official docs skill or the MCP tool skill. */
export type McpSkillKind = 'official' | 'mcp';

/** The directory/file stem for a skill flavor. */
export function skillNameFor(kind: McpSkillKind = 'official'): string {
    return kind === 'official' ? OFFICIAL_SKILL_NAME : MCP_SKILL_NAME;
}

/** Where to check/install a skill. */
export interface McpSkillTarget {
    /** The agent/harness to install into. */
    agent: McpProviderId;
    /** Project (default) or global (user profile). */
    scope?: McpScope;
    /** The project root (default: cwd). */
    cwd?: string;
    /** The custom directory (required for `agent: 'custom'`). */
    dir?: string;
    /** The skill flavor. @default `'official'` */
    kind?: McpSkillKind;
}

/** The state of one skill target. */
export interface McpSkillStatus {
    agent: McpProviderId;
    kind: McpSkillKind;
    /** The absolute `SKILL.md`/instructions path. */
    path: string;
    exists: boolean;
}

export interface InstallMcpSkillOptions extends McpSkillTarget {
    /** Overwrite an existing skill file. @default `false` */
    force?: boolean;
}

export interface InstallMcpSkillResult extends McpSkillStatus {
    /** Whether this call wrote the file. */
    installed: boolean;
}

/** The resolved `toolchain.mcp.skills` settings. */
export interface McpSkillsSettings {
    /** Agents to check/install. */
    agents: McpProviderId[];
    scope: McpScope;
    /** The custom directory, when `agents` includes `custom`. */
    dir?: string;
    /** Overwrite existing skill files. */
    force: boolean;
}

interface McpSkillsConfigView {
    enabled?: boolean;
    agents?: McpProviderId | McpProviderId[];
    scope?: McpScope;
    dir?: string;
    force?: boolean;
}

/** The builtin agents (the custom-directory provider needs an explicit `dir`). */
const BUILTIN_AGENTS: McpProviderId[] = MCP_PROVIDERS.map(provider => provider.id);

/**
 * Resolve `toolchain.mcp.skills`.
 *
 * Returns `undefined` unless the section is defined and enabled, so automatic
 * installation during sync is strictly opt-in by presence. Agent(s) default to
 * every builtin provider, the scope defaults to `project`, and `force` defaults
 * to `false`.
 */
export function resolveMcpSkillsConfig(
    config: ToolchainConfig = {}
): McpSkillsSettings | undefined {
    const mcp = sectionConfig(config.mcp);
    const skills = (mcp as { skills?: boolean | McpSkillsConfigView } | undefined)?.skills;
    if (!sectionEnabled(skills)) return undefined;
    const settings = (sectionConfig(skills) ?? {}) as McpSkillsConfigView;
    const agents =
        settings.agents === undefined
            ? [...BUILTIN_AGENTS]
            : Array.isArray(settings.agents)
              ? [...settings.agents]
              : [settings.agents];
    return {
        agents,
        scope: settings.scope === 'global' ? 'global' : 'project',
        ...(settings.dir ? { dir: settings.dir } : {}),
        force: settings.force === true,
    };
}

/** The skill body installed by `dbx skills --official`. */
export function renderOfficialSkill(): string {
    return [
        '---',
        'name: deltabox-toolchain',
        'description: >',
        '  Official deltabox toolchain (`dbx`) guidance. Use when the user asks about',
        '  dbx or the @deltabox packages: its CLI, configuration, Vite plugin, config',
        '  generator, changelog/release automation, MCP server, templates, tsconfig',
        '  or migrations. Read https://toolchain.deltabox.studio/llms.txt first and',
        '  follow the most relevant docs page before answering or editing files.',
        '---',
        '',
        '# deltabox toolchain',
        '',
        `When the user asks about dbx or the deltabox toolchain, read`,
        `<${OFFICIAL_SKILL_DOCS_URL}> first (the complete docs bundle), then find and`,
        'read the pages that match the request. Base the answer and any file edits on',
        'those docs, and prefer documented commands/options over guessing.',
        '',
        '## Inspect the project first',
        '',
        '1. **Check whether the toolchain is enabled and configured.**',
        '   - Look for a `dbx.config.*` file at the project root (or an ancestor).',
        '   - Otherwise look for a `vite.config.*` that imports `dbx()` from',
        '     `@deltabox/toolchain/vite` (or `vite-plugin-dbx`) and read its',
        '     `toolchain` options.',
        '   - Also check `.vscode/settings.json` for',
        '     `"deltabox.toolchain.enabled"`. A project-level `toolchain.enabled`',
        '     value takes precedence over that editor setting.',
        '   - If no config exists or the toolchain is disabled, do not assume dbx',
        '     manages the project.',
        '',
        '2. **Use the generated project graph when `.dbx/toolchain/` exists.**',
        '   - `.dbx/toolchain/projects.json` lists every discovered project with',
        '     its `config`/`plugin` path and workspace dependencies. Use it to find',
        '     the right config or workspace instead of searching the filesystem.',
        '   - `.dbx/toolchain/manifest.json` lists the files managed by',
        '     `dbx sync`. Do not hand-edit managed files; change the config and run',
        '     `dbx sync` (or `dbx sync --check` to diagnose drift).',
        '',
        '3. **Read the toolchain config to see which features are active.**',
        '   Sections are opt-in by presence (`toolchain.<section>`):',
        '   - `changelog` / `ci.changelog` enable changelog automation and',
        '     commitlint. When the user asks to commit, follow the generated',
        '     `commitlint.config.mjs` (Conventional Commits with its allowed types',
        '     and scopes). Do not hand-edit `CHANGELOG.md`; `dbx changelog` owns it.',
        '   - `fmt` / `lint`, `tsconfig`, `ci`, `templates`, `mcp` and the other',
        '     sections have their own generated files and conventions.',
        '   - `hooks` are lifecycle callbacks that may run during sync/versioning.',
        '',
        'Useful entry points in the bundle:',
        '',
        '- `guide/cli` — commands, flags and programmatic routing.',
        '- `guide/config-generator` — schemas, loaders and generated CLI programs.',
        '- `guide/changelog` — changelog, versioning and release automation.',
        '- `guide/mcp` — the MCP server and agent skills.',
        '- `guide/migrations/v2-v3` — upgrading an existing project.',
        '',
        'If a command or flag is still unclear, run `dbx <command> --help`.',
        '',
        'This skill is documentation-only. Use `dbx mcp:install` when the project',
        'also wants the MCP tools.',
        '',
    ].join('\n');
}

function providerOf(agent: McpProviderId): McpProvider {
    const provider = listMcpProviders().find(candidate => candidate.id === agent);
    if (!provider) throw new Error(`unknown skill agent "${agent}".`);
    return provider;
}

function resolveSkillTarget(target: McpSkillTarget): {
    provider: McpProvider;
    kind: McpSkillKind;
    file: string;
} {
    const provider = providerOf(target.agent);
    const custom = provider.id === 'custom';
    if (custom && !target.dir) {
        throw new Error('the custom skill agent requires a `dir`.');
    }
    const kind = target.kind ?? 'official';
    const base = custom
        ? path.resolve(target.dir as string)
        : path.resolve(target.cwd ?? process.cwd());
    return {
        provider,
        kind,
        file: provider.skillPath(target.scope ?? 'project', base, skillNameFor(kind)),
    };
}

/** Check whether a skill is already installed for an agent/location. */
export function checkSkill(target: McpSkillTarget): McpSkillStatus {
    const { provider, kind, file } = resolveSkillTarget(target);
    return { agent: provider.id, kind, path: file, exists: fs.existsSync(file) };
}

/**
 * Install a skill only when missing. Existing files are preserved unless
 * `force` is true.
 */
export function installSkill(options: InstallMcpSkillOptions): InstallMcpSkillResult {
    const status = checkSkill(options);
    if (status.exists && options.force !== true) {
        return { ...status, installed: false };
    }
    const { provider } = resolveSkillTarget(options);
    const content = status.kind === 'official' ? renderOfficialSkill() : renderSkill(provider.id);
    fs.mkdirSync(path.dirname(status.path), { recursive: true });
    fs.writeFileSync(status.path, content, 'utf-8');
    return { ...status, exists: true, installed: true };
}

/** Install the official docs skill (optionally forcing an overwrite). */
export function installOfficialSkill(
    options: Omit<InstallMcpSkillOptions, 'kind'>
): InstallMcpSkillResult {
    return installSkill({ ...options, kind: 'official' });
}

/** Install multiple skill targets, skipping ones that already exist. */
export function installSkills(
    targets: readonly Omit<InstallMcpSkillOptions, 'kind'>[]
): InstallMcpSkillResult[] {
    return targets.map(target => installOfficialSkill(target));
}
