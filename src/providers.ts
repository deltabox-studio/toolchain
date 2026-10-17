/**
 * The provider registry.
 *
 * Each registered provider (currently Vite+) contributes CLI commands and the
 * metadata the VS Code extension renders. The extension reads this over
 * `dbx providers --json`, so adding a provider here surfaces it in the
 * editor automatically.
 */

import { providerActions, type ToolchainProvider } from '@deltabox/toolchain-shared';
import { viteProvider } from '@deltabox/toolchain-vite';

export type {
    ToolchainProvider,
    ToolchainProviderAction,
    ToolchainProviderCommand,
} from '@deltabox/toolchain-shared';
export { providerActions } from '@deltabox/toolchain-shared';
export { viteProvider } from '@deltabox/toolchain-vite';

/** The registered providers, each with its actions resolved (defaults applied). */
export function toolchainProviders(): ToolchainProvider[] {
    return [viteProvider()].map(provider => ({ ...provider, actions: providerActions(provider) }));
}
