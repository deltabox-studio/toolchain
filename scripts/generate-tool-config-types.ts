#!/usr/bin/env node
/**
 * Generate the external tool config types that do not ship TypeScript types of
 * their own from their official JSON schema.
 *
 *   yarn config:generate
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { createConfigEngine, formatGenerated } from '@deltabox/toolchain/config';
import { logger } from '@deltabox/toolchain/shared';

import { sanitizeJsonSchema } from './lib/sanitize-json-schema.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const schemasDir = path.join(root, 'packages/shared/src/config-schema/schemas');
const outDir = path.join(root, 'packages/shared/src/config-schema/generated');

interface ToolTypeSpec {
    /** Schema file in `packages/shared/src/config-schema/schemas`. */
    schema: string;
    /** Generated type name. */
    id: string;
    /** Output file in `packages/shared/src/config-schema/generated`. */
    out: string;
    /** Wider widths keep the huge schemas from being reformatted into MBs. */
    printWidth: number;
    /** Human-readable schema source for the generated header. */
    source: string;
}

const specs: ToolTypeSpec[] = [
    {
        schema: 'biome.json',
        id: 'BiomeConfig',
        out: 'biome-config.ts',
        printWidth: 300,
        source: "Biome's configuration_schema.json",
    },
    {
        schema: 'oxfmt.json',
        id: 'OxfmtConfig',
        out: 'oxfmt-config.ts',
        printWidth: 100,
        source: "Oxfmt's configuration_schema.json",
    },
    {
        schema: 'oxlint.json',
        id: 'OxlintConfig',
        out: 'oxlint-config.ts',
        printWidth: 300,
        source: "Oxlint's configuration_schema.json",
    },
];

for (const spec of specs) {
    const schemaPath = path.join(schemasDir, spec.schema);
    const outPath = path.join(outDir, spec.out);
    const raw = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const sanitized = sanitizeJsonSchema(raw) as Parameters<typeof z.fromJSONSchema>[0];
    const schema = z.fromJSONSchema(sanitized).meta({ id: spec.id });
    const engine = createConfigEngine({ schema });
    const types = engine.generateConfigTypes();
    const generated = types[spec.id];
    if (!generated) throw new Error(`${spec.schema} did not generate a ${spec.id} type.`);
    const helpers = Object.entries(types)
        .filter(([name]) => name !== spec.id)
        .map(([, value]) => value.trimEnd());
    const header =
        `// Generated from ${spec.source} \u2014 do not edit.\n` +
        '// Run `yarn config:generate` to refresh.';
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
