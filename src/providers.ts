/**
 * The provider registry.
 *
 * Each registered provider (Vite+ and any custom ones) contributes CLI commands
 * and the metadata the VS Code extension renders. The extension reads this over
 * `dbx providers --json`, so adding a provider here surfaces it in the editor
 * automatically.
 */

import { readAllProviders, readAllProvidersSync } from '@deltabox/toolchain-core';
import { providerActions, type ToolchainProvider } from '@deltabox/toolchain-shared';
import { viteProvider } from '@deltabox/toolchain-vite';

export type {
    ToolchainProvider,
    ToolchainProviderAction,
    ToolchainProviderCommand,
} from '@deltabox/toolchain-shared';
export { providerActions } from '@deltabox/toolchain-shared';
export { viteProvider } from '@deltabox/toolchain-vite';

function withBuiltins(providers: ToolchainProvider[]): ToolchainProvider[] {
    const seen = new Set<string>();
    const out: ToolchainProvider[] = [];
    for (const provider of [viteProvider(), ...providers]) {
        if (seen.has(provider.id)) continue;
        seen.add(provider.id);
        out.push({ ...provider, actions: providerActions(provider) });
    }
    return out;
}

/**
 * The registered providers from the local registries: the built-ins, then any
 * custom ones from the project + global registries, deduped by id. Each carries
 * its resolved actions (defaults applied). Remote registries are skipped; use
 * {@link loadToolchainProviders} for those.
 */
export function toolchainProviders(cwd: string = process.cwd()): ToolchainProvider[] {
    return withBuiltins(readAllProvidersSync(cwd));
}

/** Like {@link toolchainProviders}, but also fetches remote registries. */
export async function loadToolchainProviders(
    cwd: string = process.cwd()
): Promise<ToolchainProvider[]> {
    return withBuiltins(await readAllProviders(cwd));
}
