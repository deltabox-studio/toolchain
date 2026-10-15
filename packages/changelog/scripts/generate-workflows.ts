#!/usr/bin/env tsx
/**
 * Regenerate the reference workflows under `src/ci/github/workflows` from the
 * data-driven builder (default tokens). Run after changing `src/workflows.ts`:
 *
 *   yarn tsx packages/changelog/scripts/generate-workflows.ts
 *
 * A unit test asserts the committed files match the builder output.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    DEFAULT_WORKFLOW_TOKENS,
    renderWorkflow,
    WORKFLOW_FILENAMES,
    type WorkflowId,
} from '../src/workflows.js';

const dir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../src/ci/github/workflows'
);

for (const id of Object.keys(WORKFLOW_FILENAMES) as WorkflowId[]) {
    const yaml = renderWorkflow(id, { tokens: DEFAULT_WORKFLOW_TOKENS });
    if (!yaml) continue;
    const file = path.resolve(dir, WORKFLOW_FILENAMES[id]);
    fs.writeFileSync(file, yaml, 'utf-8');
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
