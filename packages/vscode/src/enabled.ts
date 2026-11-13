/** The auto-sync/toolchain enabled state, split by scope. */
export type EnabledScope = 'global' | 'workspace';

/** The `toolchain.enabled` config value (resolved by the CLI). */
export interface EnabledConfigValue {
    enabled?: boolean | { disabled?: boolean; scope: EnabledScope };
}

/** The subset of VS Code's `inspect('enabled')` result the resolver needs. */
export interface EnabledSettingInspect {
    globalValue?: boolean;
    workspaceValue?: boolean;
    workspaceFolderValue?: boolean;
    defaultValue?: boolean;
}

export interface ResolvedEnabledState {
    /** The effective value (toolchain config wins over the VS Code setting). */
    enabled: boolean;
    /** The global-scoped VS Code setting. */
    globalEnabled: boolean;
    /** The workspace-scoped VS Code setting. */
    workspaceEnabled: boolean;
    /** Where the effective value came from. */
    source: 'config' | 'setting' | 'default';
}

/** The workspace-scoped setting (folder > workspace > global > default). */
function workspaceSetting(inspected: EnabledSettingInspect | undefined): {
    value: boolean;
    explicit: boolean;
} {
    if (inspected?.workspaceFolderValue !== undefined) {
        return { value: inspected.workspaceFolderValue, explicit: true };
    }
    if (inspected?.workspaceValue !== undefined) {
        return { value: inspected.workspaceValue, explicit: true };
    }
    if (inspected?.globalValue !== undefined) {
        return { value: inspected.globalValue, explicit: true };
    }
    return { value: inspected?.defaultValue ?? true, explicit: false };
}

/**
 * Resolve the effective auto-sync state. The project's resolved `toolchain.enabled`
 * config takes precedence over `.vscode/settings.json`; when the config does not
 * set it, the workspace-scoped VS Code setting (falling back to global/default)
 * is used.
 */
export function resolveEnabledState(
    config: EnabledConfigValue | undefined,
    inspected: EnabledSettingInspect | undefined
): ResolvedEnabledState {
    const globalEnabled = inspected?.globalValue ?? inspected?.defaultValue ?? true;
    const workspace = workspaceSetting(inspected);
    const value = config?.enabled;
    let configured: boolean | undefined;
    if (typeof value === 'boolean') configured = value;
    else if (value && typeof value === 'object') configured = value.disabled !== true;

    if (configured !== undefined) {
        return {
            enabled: configured,
            globalEnabled,
            workspaceEnabled: workspace.value,
            source: 'config',
        };
    }
    return {
        enabled: workspace.value,
        globalEnabled,
        workspaceEnabled: workspace.value,
        source: workspace.explicit ? 'setting' : 'default',
    };
}

/** The action label for a scope menu item. */
export function toggleLabel(scope: EnabledScope, enabled: boolean): string {
    return `${enabled ? 'Disable' : 'Enable'} (${scope})`;
}
