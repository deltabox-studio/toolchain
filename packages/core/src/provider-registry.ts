/**
 * The custom provider registry.
 *
 * Beyond the built-in providers (Vite+), a consumer can register extra
 * providers in `.dbx/toolchain/providers.json`. {@link readProviderRegistry}
 * feeds `toolchainProviders()`, so a registered provider surfaces everywhere
 * (the CLI, `dbx providers --json` and the VS Code extension), and the VS Code
 * "Providers" view writes this file when you add or remove one.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { ToolchainProvider } from '@deltabox/toolchain-shared';

const REGISTRY_DIR = path.join('.dbx', 'toolchain');
const REGISTRY_FILE = 'providers.json';

/** The absolute path of a project's provider registry file. */
export function providerRegistryPath(cwd: string = process.cwd()): string {
    return path.join(cwd, REGISTRY_DIR, REGISTRY_FILE);
}

/** The absolute path of the global (`~/.dbx/toolchain/.registry`) provider file. */
export function globalProviderRegistryPath(): string {
    return path.join(os.homedir(), '.dbx', 'toolchain', '.registry', REGISTRY_FILE);
}

function readProvidersFile(file: string): ToolchainProvider[] {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown;
        return Array.isArray(parsed) ? (parsed as ToolchainProvider[]) : [];
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

/** Read a project's custom providers (empty when the registry is absent/invalid). */
export function readProviderRegistry(cwd: string = process.cwd()): ToolchainProvider[] {
    return readProvidersFile(providerRegistryPath(cwd));
}

/** Write a project's custom providers (removing the file when the list is empty). */
export function writeProviderRegistry(cwd: string, providers: ToolchainProvider[]): void {
    writeProvidersFile(providerRegistryPath(cwd), providers);
}

/** Read the global (`~/.dbx/toolchain/.registry/providers.json`) providers. */
export function readGlobalProviders(): ToolchainProvider[] {
    return readProvidersFile(globalProviderRegistryPath());
}

/** Write the global providers (removing the file when the list is empty). */
export function writeGlobalProviders(providers: ToolchainProvider[]): void {
    writeProvidersFile(globalProviderRegistryPath(), providers);
}

/**
 * The project's providers plus the global ones, deduped by id (a project
 * provider wins over a global one with the same id).
 */
export function readAllProviders(cwd: string = process.cwd()): ToolchainProvider[] {
    const seen = new Set<string>();
    const providers: ToolchainProvider[] = [];
    for (const provider of [...readProviderRegistry(cwd), ...readGlobalProviders()]) {
        if (seen.has(provider.id)) continue;
        seen.add(provider.id);
        providers.push(provider);
    }
    return providers;
}
