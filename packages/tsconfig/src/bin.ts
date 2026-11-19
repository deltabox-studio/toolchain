#!/usr/bin/env node
/**
 * Standalone tsconfig entry point (`@deltabox/toolchain-tsconfig`'s bin).
 * Kept separate from the generator module so importing the API never runs it.
 */
import { logger } from '@deltabox/toolchain/shared';

import { runTsconfigCli } from './cli/generate/index.js';

try {
    runTsconfigCli();
} catch (error) {
    logger.error(`Failed to generate tsconfigs due to: ${error}`);
    process.exitCode = 1;
}
