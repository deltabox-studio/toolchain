/**
 * The provider model.
 *
 * A *provider* is an external toolchain that `@deltabox/toolchain` exposes through
 * its three surfaces: the `dbx` CLI, the programmatic API and the VS
 * Code extension. A provider wraps a binary (eg. Vite+'s `vp`) and contributes
 * namespaced CLI commands (`vite:dev`, `vite:build`, ...) plus the metadata the
 * extension needs to build menus and run everything through the CLI.
 *
 * Providers stay framework-agnostic: they never import a CLI/editor framework,
 * they just describe commands + actions. The root CLI and the extension consume
 * this description (the extension over `dbx providers --json`).
 */

/** A CLI command a provider contributes (namespaced, eg. `vite:dev`). */
export interface ToolchainProviderCommand {
    /** The namespaced `dbx` command name, eg. `vite:dev`. */
    name: string;
    /** The wrapped subcommand on the provider binary, eg. `dev`. */
    subcommand: string;
    /** Human-readable description. */
    description: string;
    /** UI group (eg. `develop`, `build`, `deps`). */
    group?: string;
    /** Alternate names the binary accepts, eg. `i` for `install`. */
    aliases?: string[];
}

/** A curated action the VS Code extension can surface for a provider. */
export interface ToolchainProviderAction {
    /** Stable id, unique within the provider. */
    id: string;
    /** Menu label. */
    label: string;
    /** Longer description / tooltip. */
    description?: string;
    /** The `dbx` command to run (no args). */
    command: string;
    /** UI group. */
    group?: string;
}

/** A provider descriptor consumed by the CLI + the VS Code extension. */
export interface ToolchainProvider {
    /** Stable id, eg. `vite-plus`. */
    id: string;
    /** Display name, eg. `Vite+`. */
    name: string;
    /** One-line description. */
    description?: string;
    /** Project homepage. */
    homepage?: string;
    /** The external binary the provider wraps, eg. `vp`. */
    binary?: string;
    /** The commands the provider contributes to the CLI. */
    commands: ToolchainProviderCommand[];
    /** Curated actions for the extension (defaults to one per command). */
    actions?: ToolchainProviderAction[];
}

/**
 * Derive the default actions (one per command) for a provider that does not
 * declare its own. This keeps a provider descriptor minimal while still giving
 * the extension something to render.
 */
export function providerActions(provider: ToolchainProvider): ToolchainProviderAction[] {
    if (provider.actions?.length) return provider.actions;
    return provider.commands.map(command => ({
        id: command.name.replace(/[:]/g, '-'),
        label: command.description,
        command: command.name,
        ...(command.group ? { group: command.group } : {}),
    }));
}
