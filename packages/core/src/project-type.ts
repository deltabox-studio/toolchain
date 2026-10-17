import fs from 'node:fs';
import path from 'node:path';

import { type ProjectType, readJsonAt, type ToolchainConfig } from '@deltabox/toolchain-shared';

/**
 * Resolve the project kind: an explicit `project.type` in the config wins,
 * otherwise it is detected from the filesystem.
 */
export function resolveProjectType(cwd: string, config: ToolchainConfig = {}): ProjectType {
    if (config.project?.type) return config.project.type;
    return detectProjectType(cwd);
}

/** Detect the project kind from `cwd` (workspaces / monorepo file heuristics). */
export function detectProjectType(cwd: string): ProjectType {
    const pkg = readJsonAt<{ workspaces?: unknown }>(cwd, 'package.json');
    const workspaces = pkg?.workspaces;
    const hasWorkspaces = Array.isArray(workspaces)
        ? workspaces.length > 0
        : !!workspaces &&
          Array.isArray((workspaces as { packages?: unknown[] }).packages) &&
          (workspaces as { packages: unknown[] }).packages.length > 0;

    if (hasWorkspaces || fs.existsSync(path.join(cwd, 'tsconfig.monorepo.json'))) {
        return 'monorepo-root';
    }
    if (fs.existsSync(path.join(cwd, 'tsconfig.default.json'))) {
        return 'monorepo-workspace';
    }
    return 'project';
}
