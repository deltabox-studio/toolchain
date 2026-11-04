#!/usr/bin/env node
/**
 * Standalone changelog entry point (`@deltabox/toolchain-changelog`'s bin).
 * Kept separate from `run.ts` so importing the API never runs the pipeline.
 */
import { runChangelog } from './run.js';

runChangelog();
