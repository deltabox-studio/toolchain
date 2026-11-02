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

import { createConfigEngine, formatGenerated } from '@deltabox/toolchain-config';
import { logger } from '@deltabox/toolchain-shared';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const schemaPath = path.join(root, 'packages/shared/src/config-schema/schemas/biome.json');
const outPath = path.join(root, 'packages/shared/src/config-schema/generated/biome-config.ts');

const schema = z
    .fromJSONSchema(JSON.parse(fs.readFileSync(schemaPath, 'utf8')))
    .meta({ id: 'BiomeConfig' });
const engine = createConfigEngine({ schema });
const types = engine.generateConfigTypes();
const biome = types.BiomeConfig;
if (!biome) throw new Error('biome schema did not generate a BiomeConfig type.');

const header =
    "// Generated from Biome's configuration_schema.json \u2014 do not edit.\n" +
    '// Run `yarn config:generate` to refresh.';
const content = `${header}\n\n${biome.trimEnd()}\n`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, await formatGenerated(content, { fileName: outPath }), 'utf-8');

logger.info(`Generated ${path.relative(root, outPath)}`);
