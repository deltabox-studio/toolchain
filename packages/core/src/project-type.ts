import fs from 'node:fs';
import path from 'node:path';

import {
    type ProjectType,
    readJsonAt,
    sectionConfig,
    type ToolchainConfig,
} from '@deltabox/toolchain-shared';

/** The tsconfig file names a project can be detected from. */
export interface TsconfigFileNames {
    /** The workspaces tsconfig file name (default `tsconfig.workspaces.json`). */
    rootFile?: string;
    /** The workspace default tsconfig file name (default `tsconfig.default.json`). */
    defaultFile?: string;
}

/**
 * Resolve the project kind: an explicit `project.type` in the config wins,
 * otherwise it is detected from the filesystem.
 */
export function resolveProjectType(cwd: string, config: ToolchainConfig = {}): ProjectType {
    if (config.project?.type) return config.project.type;
    const t = sectionConfig(config.tsconfig) ?? {};
    return detectProjectType(cwd, {
        ...(t.rootFile !== undefined ? { rootFile: t.rootFile } : {}),
        ...(t.defaultFile !== undefined ? { defaultFile: t.defaultFile } : {}),
    });
}

/** Detect the project kind from `cwd` (workspaces / monorepo file heuristics). */
export function detectProjectType(cwd: string, files: TsconfigFileNames = {}): ProjectType {
    const rootFile = files.rootFile ?? 'tsconfig.workspaces.json';
    const defaultFile = files.defaultFile ?? 'tsconfig.default.json';
    const pkg = readJsonAt<{ workspaces?: unknown }>(cwd, 'package.json');
    const workspaces = pkg?.workspaces;
    const hasWorkspaces = Array.isArray(workspaces)
        ? workspaces.length > 0
        : !!workspaces &&
          Array.isArray((workspaces as { packages?: unknown[] }).packages) &&
          (workspaces as { packages: unknown[] }).packages.length > 0;

    if (hasWorkspaces || fs.existsSync(path.join(cwd, rootFile))) {
        return 'monorepo-root';
    }
    if (fs.existsSync(path.join(cwd, defaultFile))) {
        return 'monorepo-workspace';
    }
    return 'project';
}
