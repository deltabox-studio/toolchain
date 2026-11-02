#!/usr/bin/env node
/**
 * Generate the CI workflow types from the vendored vendor schemas.
 *
 *   yarn config:generate
 *
 * GitHub and GitLab use JSON Schema keywords Zod cannot consume directly
 * (`not`, `if`/`then`/`else`, `patternProperties`), so the schemas are
 * normalized before `z.fromJSONSchema` sees them.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { createConfigEngine, formatGenerated } from '@deltabox/toolchain-config';
import { logger } from '@deltabox/toolchain-shared';

import { sanitizeJsonSchema } from './lib/sanitize-json-schema.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const schemasDir = path.join(root, 'packages/shared/src/config-schema/schemas');
const outDir = path.join(root, 'packages/shared/src/config-schema/generated');

interface WorkflowTypeSpec {
    file: string;
    id: string;
    out: string;
    /** Biome's type is huge; keep the Azure one compact too. */
    printWidth: number;
}

const specs: WorkflowTypeSpec[] = [
    {
        file: 'github-workflow.json',
        id: 'GitHubWorkflow',
        out: 'github-workflow.ts',
        printWidth: 100,
    },
    { file: 'gitlab-ci.json', id: 'GitLabCi', out: 'gitlab-ci.ts', printWidth: 100 },
    {
        file: 'azure-pipelines.json',
        id: 'AzurePipelines',
        out: 'azure-pipelines.ts',
        printWidth: 300,
    },
];

const header =
    '// Generated from the vendored vendor workflow schema — do not edit.\n' +
    '// Run `yarn config:generate` to refresh.';

for (const spec of specs) {
    const schemaPath = path.join(schemasDir, spec.file);
    const outPath = path.join(outDir, spec.out);
    const raw = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const sanitized = sanitizeJsonSchema(raw) as Parameters<typeof z.fromJSONSchema>[0];
    const schema = z.fromJSONSchema(sanitized).meta({ id: spec.id });
    const engine = createConfigEngine({ schema });
    const types = engine.generateConfigTypes();
    const generated = types[spec.id];
    if (!generated) throw new Error(`${spec.file} did not generate a ${spec.id} type.`);
    // A schema can also emit helper types (eg. Azure's `__schema0`); keep them
    // in the same file so the main type's references resolve.
    const helpers = Object.entries(types)
        .filter(([name]) => name !== spec.id)
        .map(([, value]) => value.trimEnd());
    const content = `${header}\n\n${[generated.trimEnd(), ...helpers].join('\n\n')}\n`;
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
        outPath,
        await formatGenerated(content, {
            fileName: outPath,
            options: { printWidth: spec.printWidth },
        }),
        'utf-8'
    );
    logger.info(`Generated ${path.relative(root, outPath)}`);
}
