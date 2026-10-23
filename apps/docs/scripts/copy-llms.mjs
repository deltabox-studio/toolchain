/**
 * Copy the LLM files `vitepress-plugin-llms` generates into `.vitepress/dist`
 * (`llms.txt`, `llms-full.txt`) up to the repository root, so they are available
 * when browsing the repo (not only on the deployed site).
 *
 * Run after `vitepress build` (the docs `build` script chains it).
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // apps/docs/scripts
const docsRoot = resolve(here, '..'); // apps/docs
const repoRoot = resolve(docsRoot, '..', '..'); // repo root
const dist = resolve(docsRoot, '.vitepress', 'dist');

for (const name of ['llms.txt', 'llms-full.txt']) {
    const source = resolve(dist, name);
    if (existsSync(source)) {
        copyFileSync(source, resolve(repoRoot, name));
        console.log(`copied ${name} -> ${resolve(repoRoot, name)}`);
    }
}
