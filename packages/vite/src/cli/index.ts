/**
 * The `dbx vite:*` commands.
 *
 * `dbx vite <anything>` forwards every operand to the `vp` binary (so
 * the whole Vite+ CLI is reachable), and each catalogued subcommand gets a
 * first-class `dbx vite:<name>` alias for discoverability + the editor.
 */

import path from 'node:path';

import { logger, sectionConfig, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { VP_COMMANDS, viteCommandName } from '../commands.js';
import { runVp } from '../vp.js';

export { resolveVpCommand } from '../commands.js';

/** A leading `--cwd` lets a passthrough target another project root. */
const CWD_OPTION = {
    flags: '--cwd <dir>',
    description: 'Project root to run `vp` in (default: cwd).',
};

/**
 * Env marker guarding against a task that re-invokes itself. A `run` command
 * records its root + operands here before spawning the task runner; when the
 * same command runs again from the same root (a root task whose script calls
 * `run -r <task>` again), it is pruned so the recursion cannot happen.
 */
const RUN_GUARD_ENV = 'DBX_RUN_GUARD';

/** The guard key for a `run` invocation, or `undefined` for other commands. */
export function runGuard(args: string[], cwd: string): string | undefined {
    if (args[0] !== 'run') return undefined;
    return `${path.resolve(cwd)}|${args.slice(1).join(' ')}`;
}

/** Build a passthrough command that forwards `leading + raw operands` to `vp`. */
function passthroughCommand(
    name: string,
    description: string,
    leading: string[]
): ToolchainCommand {
    return {
        name,
        description,
        passthrough: true,
        options: [CWD_OPTION],
        run: async (opts, context) => {
            const raw = (opts.args as string[] | undefined) ?? [];
            const cwd = (opts.cwd as string | undefined) ?? context.cwd;
            const args = [...leading, ...raw];
            const guard = runGuard(args, cwd);
            if (guard && process.env[RUN_GUARD_ENV] === guard) {
                logger.debug(`pruned a self-referential \`${args.join(' ')}\``);
                return;
            }
            // Provider colour follows the logger (so `--no-color` turns it off)
            // unless the `providers` section opts out even on a colour terminal.
            const color =
                logger.colors.isColorSupported &&
                sectionConfig(context.config.providers)?.color !== false;
            const result = await runVp(args, {
                cwd,
                color,
                ...(guard ? { env: { [RUN_GUARD_ENV]: guard } } : {}),
            });
            if (result.code !== 0) process.exitCode = result.code;
        },
    };
}

/** Every Vite+ passthrough command (the generic `vite` + one per subcommand). */
export function viteCommands(): ToolchainCommand[] {
    const generic = passthroughCommand(
        'vite',
        'Run any Vite+ command through `vp` (eg. `dbx vite dev`).',
        []
    );
    const named = VP_COMMANDS.map(command =>
        passthroughCommand(viteCommandName(command.name), `Vite+: ${command.description}`, [
            command.name,
        ])
    );
    return [generic, ...named];
}
