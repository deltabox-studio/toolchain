/**
 * Remove leftover emulate sandboxes.
 *
 * The emulate suite creates throwaway workspaces under the OS temp directory
 * (`dbx-emulate-*`) and cleans them on completion / interruption. A hard kill
 * (or a crashed worker) can leave some behind; this removes them safely.
 *
 *   yarn test:clean
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = os.tmpdir();
let removed = 0;

for (const name of fs.readdirSync(temp)) {
    if (!name.startsWith('dbx-emulate-')) continue;
    try {
        fs.rmSync(path.join(temp, name), { recursive: true, force: true });
        removed += 1;
    } catch {
        // best-effort
    }
}

// Older versions kept the scratch workspaces inside the repo.
const legacy = path.join(root, 'tests', 'emulate');
if (fs.existsSync(legacy)) {
    try {
        fs.rmSync(legacy, { recursive: true, force: true });
        removed += 1;
    } catch {
        // best-effort
    }
}

console.log(
    removed > 0
        ? `Removed ${removed} emulate sandbox${removed === 1 ? '' : 'es'}.`
        : 'No emulate sandboxes to remove.'
);
