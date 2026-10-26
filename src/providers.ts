/**
 * The provider registry.
 *
 * Each registered provider (currently Vite+) contributes CLI commands and the
 * metadata the VS Code extension renders. The extension reads this over
 * `dbx providers --json`, so adding a provider here surfaces it in the
 * editor automatically.
 */

import { readAllProviders } from '@deltabox/toolchain-core';
import { providerActions, type ToolchainProvider } from '@deltabox/toolchain-shared';
import { viteProvider } from '@deltabox/toolchain-vite';

export type {
    ToolchainProvider,
    ToolchainProviderAction,
    ToolchainProviderCommand,
} from '@deltabox/toolchain-shared';
export { providerActions } from '@deltabox/toolchain-shared';
export { viteProvider } from '@deltabox/toolchain-vite';

/**
 * The registered providers: the built-ins, then any custom ones from the
 * project + global registries, deduped by id. Each
 * carries its resolved actions (defaults applied).
 */
export function toolchainProviders(cwd: string = process.cwd()): ToolchainProvider[] {
    const seen = new Set<string>();
    const providers: ToolchainProvider[] = [];
    for (const provider of [viteProvider(), ...readAllProviders(cwd)]) {
        if (seen.has(provider.id)) continue;
        seen.add(provider.id);
        providers.push({ ...provider, actions: providerActions(provider) });
    }
    return providers;
}
