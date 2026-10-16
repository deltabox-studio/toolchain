/**
 * The `dbx vite:*` commands.
 *
 * `dbx vite <anything>` forwards every operand to the `vp` binary (so
 * the whole Vite+ CLI is reachable), and each catalogued subcommand gets a
 * first-class `dbx vite:<name>` alias for discoverability + the editor.
 */

import { logger, sectionConfig, type ToolingCommand } from '@deltabox/toolchain-shared';

import { VP_COMMANDS, viteCommandName } from '../commands.js';
import { runVp } from '../vp.js';

export { resolveVpCommand } from '../commands.js';

/** A leading `--cwd` lets a passthrough target another project root. */
const CWD_OPTION = {
    flags: '--cwd <dir>',
    description: 'Project root to run `vp` in (default: cwd).',
};

/** Build a passthrough command that forwards `leading + raw operands` to `vp`. */
function passthroughCommand(name: string, description: string, leading: string[]): ToolingCommand {
    return {
        name,
        description,
        passthrough: true,
        options: [CWD_OPTION],
        run: async (opts, context) => {
            const raw = (opts.args as string[] | undefined) ?? [];
            const cwd = (opts.cwd as string | undefined) ?? context.cwd;
            // Provider colour follows the logger (so `--no-color` turns it off)
            // unless the `providers` section opts out even on a colour terminal.
            const color =
                logger.colors.isColorSupported &&
                sectionConfig(context.config.providers)?.color !== false;
            const result = await runVp([...leading, ...raw], { cwd, color });
            if (result.code !== 0) process.exitCode = result.code;
        },
    };
}

/** Every Vite+ passthrough command (the generic `vite` + one per subcommand). */
export function viteCommands(): ToolingCommand[] {
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
