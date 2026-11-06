import { sectionConfig, type ToolchainConfig } from './toolchain.js';

/** The tsconfig file names a project reads and patches (custom names honoured). */
export interface TsconfigFileNameSet {
    baseFile: string;
    rootFile: string;
    defaultFile: string;
    buildFile: string;
}

/** Resolve the configured tsconfig file names (defaults for the unset ones). */
export function tsconfigFileNames(config: ToolchainConfig): TsconfigFileNameSet {
    const t = sectionConfig(config.tsconfig) ?? {};
    return {
        baseFile: t.baseFile ?? 'tsconfig.base.json',
        rootFile: t.rootFile ?? 'tsconfig.workspaces.json',
        defaultFile: t.defaultFile ?? 'tsconfig.default.json',
        buildFile: t.buildFile ?? 'tsconfig.build.json',
    };
}
