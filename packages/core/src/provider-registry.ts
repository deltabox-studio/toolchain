/**
 * The custom provider registry.
 *
 * Beyond the built-in providers (Vite+), a consumer can register extra providers
 * in provider registries (JSON files or directories of JSON files). The search
 * paths mirror the template registry: project paths first (the implicit
 * `.dbx/toolchain/.registry/providers` plus `.dbx/toolchain/registries.json`),
 * then global paths (the CLI config / VS Code setting and the default global
 * dir). Remote `http(s)` registries are loaded by {@link readAllProviders}.
 *
 * {@link readAllProvidersSync} feeds the synchronous CLI passthrough
 * registration; {@link readAllProviders} also fetches remote registries for the
 * `providers`/`registry` commands.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { ToolchainProvider } from '@deltabox/toolchain-shared';

const REGISTRY_DIR = path.join('.dbx', 'toolchain');
/** The legacy project file, still read for compatibility. */
const LEGACY_REGISTRY_FILE = 'providers.json';
const REGISTRY_FILE = 'providers.json';

/** Expand a leading `~` to the user's home directory. */
function expandHome(value: string): string {
    if (value === '~') return os.homedir();
    if (value.startsWith('~/') || value.startsWith('~\\'))
        return path.join(os.homedir(), value.slice(2));
    return value;
}

function isRemote(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function normalizePaths(value: unknown): string[] {
    if (!value) return [];
    return (Array.isArray(value) ? value : [value])
        .map(entry => expandHome(String(entry)))
        .filter(Boolean);
}

/** The absolute path of the legacy project provider file. */
export function legacyProviderRegistryPath(cwd: string = process.cwd()): string {
    return path.join(cwd, REGISTRY_DIR, LEGACY_REGISTRY_FILE);
}

/** The default project provider registry file. */
export function providerRegistryPath(cwd: string = process.cwd()): string {
    return path.join(cwd, REGISTRY_DIR, '.registry', 'providers', REGISTRY_FILE);
}

/** The `~/.dbx/toolchain/.registry/providers` default global directory. */
export function defaultGlobalProvidersDir(): string {
    return path.join(os.homedir(), '.dbx', 'toolchain', '.registry', 'providers');
}

/** The legacy global provider file. */
export function globalProviderRegistryPath(): string {
    return path.join(os.homedir(), '.dbx', 'toolchain', '.registry', REGISTRY_FILE);
}

/** The persisted CLI config path (mirrors the template registry). */
function cliConfigPath(): string {
    return path.join(os.homedir(), '.dbx', 'toolchain', 'cli', 'config.json');
}

interface RegistrySearchPaths {
    templates?: string | string[];
    providers?: string | string[];
}

interface CliConfig {
    registrySearchPaths?: string | string[] | RegistrySearchPaths;
    providerRegistrySearchPaths?: string | string[];
    vscodeDir?: string;
}

function readCliConfig(): CliConfig {
    try {
        const raw = fs.readFileSync(cliConfigPath(), 'utf-8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(raw) as CliConfig;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

/** The provider search paths declared in the CLI config. */
function configProviderPaths(config: CliConfig = readCliConfig()): string[] {
    if (config.providerRegistrySearchPaths !== undefined) {
        return normalizePaths(config.providerRegistrySearchPaths);
    }
    const value = config.registrySearchPaths;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return normalizePaths(value.providers);
    }
    return [];
}

function projectRegistriesPath(cwd: string): string {
    return path.join(cwd, REGISTRY_DIR, 'registries.json');
}

function readProjectRegistriesFile(cwd: string): { templates?: string[]; providers?: string[] } {
    try {
        const raw = fs.readFileSync(projectRegistriesPath(cwd), 'utf-8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(raw) as { templates?: unknown; providers?: unknown };
        return {
            templates: normalizePaths(parsed.templates),
            providers: normalizePaths(parsed.providers),
        };
    } catch {
        return {};
    }
}

function writeProjectRegistriesFile(
    cwd: string,
    value: { templates?: string[]; providers?: string[] }
): void {
    const file = projectRegistriesPath(cwd);
    const next = {
        ...(value.templates && value.templates.length > 0 ? { templates: value.templates } : {}),
        ...(value.providers && value.providers.length > 0 ? { providers: value.providers } : {}),
    };
    if (Object.keys(next).length === 0) {
        fs.rmSync(file, { force: true });
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(next, null, 4)}\n`, 'utf-8');
}

function writeCliConfig(patch: Partial<CliConfig>): CliConfig {
    const next = { ...readCliConfig(), ...patch };
    const file = cliConfigPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(next, null, 4)}\n`, 'utf-8');
    return next;
}

function samePath(cwd: string, a: string, b: string): boolean {
    const normalize = (value: string): string =>
        isRemote(value) ? value : path.resolve(cwd, expandHome(value));
    return normalize(a) === normalize(b);
}

/** Add a project-scoped provider registry path (or remote URL). */
export function addProjectProviderRegistry(cwd: string, entry: string): void {
    const registries = readProjectRegistriesFile(cwd);
    const providers = registries.providers ?? [];
    if (providers.some(existing => samePath(cwd, existing, entry))) return;
    writeProjectRegistriesFile(cwd, {
        ...(registries.templates ? { templates: registries.templates } : {}),
        providers: [...providers, entry],
    });
}

/** Remove a project-scoped provider registry path (never the implicit default). */
export function removeProjectProviderRegistry(cwd: string, entry: string): void {
    const registries = readProjectRegistriesFile(cwd);
    writeProjectRegistriesFile(cwd, {
        ...(registries.templates ? { templates: registries.templates } : {}),
        ...(registries.providers
            ? {
                  providers: registries.providers.filter(
                      existing => !samePath(cwd, existing, entry)
                  ),
              }
            : {}),
    });
}

/** Add a global provider registry path (or remote URL). */
export function addGlobalProviderRegistry(entry: string): void {
    const config = readCliConfig();
    const paths = configProviderPaths(config);
    const target = expandHome(entry);
    if (paths.some(existing => samePath(process.cwd(), existing, target))) return;
    writeCliConfig({ providerRegistrySearchPaths: [...paths, target] });
}

/** Remove a global provider registry path. */
export function removeGlobalProviderRegistry(entry: string): void {
    const config = readCliConfig();
    const target = expandHome(entry);
    writeCliConfig({
        providerRegistrySearchPaths: configProviderPaths(config).filter(
            existing => !samePath(process.cwd(), existing, target)
        ),
    });
}

/** Replace the global provider search paths. */
export function setGlobalProviderRegistries(paths: string[]): void {
    writeCliConfig({ providerRegistrySearchPaths: paths.map(expandHome) });
}

/** Replace the project-scoped provider search paths. */
export function setProjectProviderRegistries(cwd: string, paths: string[]): void {
    const registries = readProjectRegistriesFile(cwd);
    writeProjectRegistriesFile(cwd, {
        ...(registries.templates ? { templates: registries.templates } : {}),
        providers: paths,
    });
}

/** Read `.dbx/toolchain/registries.json` provider paths. */
function projectProviderPaths(cwd: string): string[] {
    const entries = readProjectRegistriesFile(cwd).providers ?? [];
    return entries.map(entry => (isRemote(entry) ? entry : path.resolve(cwd, entry)));
}

export interface ProviderRegistryPath {
    path: string;
    scope: 'project' | 'global';
    remote: boolean;
}

/**
 * Every provider registry path, project first (implicit dir + project entries +
 * the legacy project file), then global (CLI config paths or the default dir,
 * plus the legacy global file). Duplicates are removed.
 */
export function providerRegistryPaths(cwd: string = process.cwd()): ProviderRegistryPath[] {
    const config = readCliConfig();
    const project: string[] = [];
    const implicit = path.join(cwd, REGISTRY_DIR, '.registry', 'providers');
    if (fs.existsSync(implicit)) project.push(implicit);
    project.push(...projectProviderPaths(cwd));
    if (fs.existsSync(legacyProviderRegistryPath(cwd)))
        project.push(legacyProviderRegistryPath(cwd));

    const configured = configProviderPaths(config);
    const global: string[] = [...configured];
    const defaultDir = defaultGlobalProvidersDir();
    if (fs.existsSync(defaultDir)) global.push(defaultDir);
    if (fs.existsSync(globalProviderRegistryPath())) global.push(globalProviderRegistryPath());

    const seen = new Set<string>();
    const out: ProviderRegistryPath[] = [];
    for (const [scope, paths] of [
        ['project', project],
        ['global', global],
    ] as const) {
        for (const entry of paths) {
            const key = isRemote(entry) ? entry : path.resolve(entry);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ path: entry, scope, remote: isRemote(entry) });
        }
    }
    return out;
}

function isProvider(value: unknown): value is ToolchainProvider {
    return (
        Boolean(value) &&
        typeof value === 'object' &&
        typeof (value as { id?: unknown }).id === 'string' &&
        typeof (value as { name?: unknown }).name === 'string' &&
        Array.isArray((value as { commands?: unknown }).commands)
    );
}

function parseProviders(value: unknown): ToolchainProvider[] {
    const list = Array.isArray(value)
        ? value
        : value &&
            typeof value === 'object' &&
            Array.isArray((value as { providers?: unknown }).providers)
          ? (value as { providers: unknown[] }).providers
          : [];
    return list.filter(isProvider);
}

function readProvidersTarget(target: string): ToolchainProvider[] {
    try {
        if (fs.statSync(target).isDirectory()) {
            const providers: ToolchainProvider[] = [];
            for (const file of fs.readdirSync(target)) {
                if (!file.toLowerCase().endsWith('.json')) continue;
                providers.push(...readProvidersTarget(path.join(target, file)));
            }
            return providers;
        }
        return parseProviders(JSON.parse(fs.readFileSync(target, 'utf-8')));
    } catch {
        return [];
    }
}

function writeProvidersFile(file: string, providers: ToolchainProvider[]): void {
    if (providers.length === 0) {
        fs.rmSync(file, { force: true });
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(providers, null, 4)}\n`, 'utf-8');
}

/** Read a project's custom providers from its provider search paths. */
export function readProviderRegistry(cwd: string = process.cwd()): ToolchainProvider[] {
    const seen = new Set<string>();
    const out: ToolchainProvider[] = [];
    for (const entry of providerRegistryPaths(cwd)) {
        if (entry.scope !== 'project' || entry.remote) continue;
        for (const provider of readProvidersTarget(entry.path)) {
            if (seen.has(provider.id)) continue;
            seen.add(provider.id);
            out.push(provider);
        }
    }
    return out;
}

/** Write a project's custom providers to the default project registry file. */
export function writeProviderRegistry(cwd: string, providers: ToolchainProvider[]): void {
    writeProvidersFile(providerRegistryPath(cwd), providers);
}

/** Read the global providers from the global search paths. */
export function readGlobalProviders(): ToolchainProvider[] {
    const seen = new Set<string>();
    const out: ToolchainProvider[] = [];
    for (const entry of providerRegistryPaths()) {
        if (entry.scope !== 'global' || entry.remote) continue;
        for (const provider of readProvidersTarget(entry.path)) {
            if (seen.has(provider.id)) continue;
            seen.add(provider.id);
            out.push(provider);
        }
    }
    return out;
}

/** Write the global providers to the default global providers file. */
export function writeGlobalProviders(providers: ToolchainProvider[]): void {
    writeProvidersFile(path.join(defaultGlobalProvidersDir(), REGISTRY_FILE), providers);
}

function dedupeProviders(providers: ToolchainProvider[]): ToolchainProvider[] {
    const seen = new Set<string>();
    const out: ToolchainProvider[] = [];
    for (const provider of providers) {
        if (seen.has(provider.id)) continue;
        seen.add(provider.id);
        out.push(provider);
    }
    return out;
}

/**
 * The project + global providers from local registries, deduped by id (a
 * project provider wins). Remote registries are skipped; use
 * {@link readAllProviders} for those.
 */
export function readAllProvidersSync(cwd: string = process.cwd()): ToolchainProvider[] {
    const entries = providerRegistryPaths(cwd);
    const project = entries.filter(entry => entry.scope === 'project' && !entry.remote);
    const global = entries.filter(entry => entry.scope === 'global' && !entry.remote);
    return dedupeProviders([
        ...project.flatMap(entry => readProvidersTarget(entry.path)),
        ...global.flatMap(entry => readProvidersTarget(entry.path)),
    ]);
}

async function fetchProviders(url: string): Promise<ToolchainProvider[]> {
    try {
        const response = await fetch(url, { headers: { accept: 'application/json' } });
        if (!response.ok) return [];
        return parseProviders(await response.json());
    } catch {
        return [];
    }
}

/**
 * The project + global providers from every search path, including remote
 * registries, deduped by id (a project provider wins).
 */
export async function readAllProviders(cwd: string = process.cwd()): Promise<ToolchainProvider[]> {
    const entries = providerRegistryPaths(cwd);
    const loaded: ToolchainProvider[] = [];
    for (const entry of entries) {
        if (entry.remote) loaded.push(...(await fetchProviders(entry.path)));
        else loaded.push(...readProvidersTarget(entry.path));
    }
    return dedupeProviders(loaded);
}
