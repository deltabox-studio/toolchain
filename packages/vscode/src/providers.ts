import { captureCli } from './cli.js';

/**
 * The provider descriptors the extension renders. They mirror the JSON emitted
 * by `dbx providers --json` (see `@deltabox/toolchain`), so the extension
 * never imports the tooling packages directly — it drives everything through
 * the resolved CLI.
 */

export interface ProviderCommand {
    /** The namespaced `dbx` command name, eg. `vite:dev`. */
    name: string;
    /** The wrapped subcommand, eg. `dev`. */
    subcommand: string;
    description: string;
    group?: string;
    aliases?: string[];
}

export interface Provider {
    id: string;
    name: string;
    description?: string;
    homepage?: string;
    binary?: string;
    commands: ProviderCommand[];
}

/** Load the providers via `dbx providers --json` (empty on failure). */
export async function loadProviders(cwd: string): Promise<Provider[]> {
    const result = await captureCli(cwd, ['providers', '--json']);
    if (result.code !== 0) return [];
    try {
        const parsed = JSON.parse(result.stdout) as unknown;
        return Array.isArray(parsed) ? (parsed as Provider[]) : [];
    } catch {
        return [];
    }
}
