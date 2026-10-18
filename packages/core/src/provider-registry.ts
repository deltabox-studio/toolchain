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
import path from 'node:path';

import type { ToolchainProvider } from '@deltabox/toolchain-shared';

const REGISTRY_DIR = path.join('.dbx', 'toolchain');
const REGISTRY_FILE = 'providers.json';

/** The absolute path of a project's provider registry file. */
export function providerRegistryPath(cwd: string = process.cwd()): string {
    return path.join(cwd, REGISTRY_DIR, REGISTRY_FILE);
}

/** Read a project's custom providers (empty when the registry is absent/invalid). */
export function readProviderRegistry(cwd: string = process.cwd()): ToolchainProvider[] {
    try {
        const parsed = JSON.parse(fs.readFileSync(providerRegistryPath(cwd), 'utf-8')) as unknown;
        return Array.isArray(parsed) ? (parsed as ToolchainProvider[]) : [];
    } catch {
        return [];
    }
}

/** Write a project's custom providers (removing the file when the list is empty). */
export function writeProviderRegistry(cwd: string, providers: ToolchainProvider[]): void {
    const file = providerRegistryPath(cwd);
    if (providers.length === 0) {
        fs.rmSync(file, { force: true });
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(providers, null, 4)}\n`, 'utf-8');
}
