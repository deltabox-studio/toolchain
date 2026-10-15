import type { ToolingCommand } from '@deltabox/toolchain-shared';

import { projectsCommand } from './projects.js';
import { providerCommands } from './providers.js';
import { resetCommand } from './reset.js';
import { syncCommand } from './sync.js';
import { watchCommand } from './watch.js';

export { providerCommands } from './providers.js';
export * from './shared.js';

/** The root commands: `projects`, `sync`, `watch`, `reset`, `providers`. */
export function syncCommands(): ToolingCommand[] {
    return [
        projectsCommand(),
        syncCommand(),
        watchCommand(),
        resetCommand(),
        ...providerCommands(),
    ];
}
