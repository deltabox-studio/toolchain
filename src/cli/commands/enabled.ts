import fs from 'node:fs';
import path from 'node:path';

import { readGlobalEnabled, writeGlobalEnabled } from '@deltabox/toolchain/core';
import { logger, mergeJsonAt, resolveToolchainEnabled } from '@deltabox/toolchain/shared';

import { rootCliProgram } from '../engine.js';

/** The VS Code setting that carries the workspace-scoped auto-sync switch. */
const VSCODE_ENABLED_KEY = 'deltabox.toolchain.enabled';

/** Read + write the workspace-scoped value in `.vscode/settings.json`. */
function writeWorkspaceEnabled(cwd: string, enabled: boolean): void {
    const content = mergeJsonAt(cwd, '.vscode/settings.json', {
        [VSCODE_ENABLED_KEY]: enabled,
    });
    const file = path.join(cwd, '.vscode', 'settings.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf-8');
}

/** `dbx enable`, `dbx disable` and `dbx enabled`. */
export function enabledCommands() {
    return rootCliProgram.create(cmd => [
        cmd('enabled')
            .description('Print whether the toolchain is enabled for this project (and the scope).')
            .option('--json', 'Print the resolved state as JSON.')
            .run(({ values: opts, context }) => {
                const resolved = resolveToolchainEnabled(context.config);
                if (opts.json) {
                    logger.raw(
                        JSON.stringify(
                            {
                                ...resolved,
                                global: readGlobalEnabled() ?? null,
                            },
                            null,
                            4
                        )
                    );
                    return;
                }
                logger.info(
                    `toolchain is ${resolved.enabled ? 'enabled' : 'disabled'} (${resolved.scope} scope).`
                );
            }),
        cmd('enable')
            .description('Enable the toolchain (workspace scope by default).')
            .option('--global', 'Set the global scope (`~/.dbx/toolchain/cli/config.json`).')
            .option('--workspace', 'Set the workspace scope (`.vscode/settings.json`).')
            .option('--cwd <dir>', 'Project root (default: cwd).')
            .option('--json', 'Print the result as JSON.')
            .run(({ values: opts, context }) => {
                const root = (opts.cwd as string | undefined) ?? context.cwd;
                const global = Boolean(opts.global);
                if (opts.global && opts.workspace) {
                    throw new Error('--global and --workspace are mutually exclusive.');
                }
                const configSetting = context.config.enabled;
                if (global) {
                    writeGlobalEnabled(true);
                } else {
                    writeWorkspaceEnabled(root, true);
                    if (configSetting !== undefined) {
                        logger.warn(
                            'enable: the project config sets `toolchain.enabled`, which takes precedence over `.vscode/settings.json`.'
                        );
                    }
                }
                const scope = global ? 'global' : 'workspace';
                const result = { enabled: true, scope };
                if (opts.json) {
                    logger.raw(JSON.stringify(result, null, 4));
                    return;
                }
                logger.info(`toolchain enabled (${scope} scope).`);
            }),
        cmd('disable')
            .description('Disable the toolchain (workspace scope by default).')
            .option('--global', 'Set the global scope (`~/.dbx/toolchain/cli/config.json`).')
            .option('--workspace', 'Set the workspace scope (`.vscode/settings.json`).')
            .option('--cwd <dir>', 'Project root (default: cwd).')
            .option('--json', 'Print the result as JSON.')
            .run(({ values: opts, context }) => {
                const root = (opts.cwd as string | undefined) ?? context.cwd;
                const global = Boolean(opts.global);
                if (opts.global && opts.workspace) {
                    throw new Error('--global and --workspace are mutually exclusive.');
                }
                const configSetting = context.config.enabled;
                if (global) {
                    writeGlobalEnabled(false);
                } else {
                    writeWorkspaceEnabled(root, false);
                    if (configSetting !== undefined) {
                        logger.warn(
                            'disable: the project config sets `toolchain.enabled`, which takes precedence over `.vscode/settings.json`.'
                        );
                    }
                }
                const scope = global ? 'global' : 'workspace';
                const result = { enabled: false, scope };
                if (opts.json) {
                    logger.raw(JSON.stringify(result, null, 4));
                    return;
                }
                logger.info(`toolchain disabled (${scope} scope).`);
            }),
    ]).commands;
}
