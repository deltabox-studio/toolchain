/**
 * Keep a consumer's `.gitignore` in sync with the toolchain's generated state.
 *
 * Everything under `.dbx/` is generated and local: the project graph embeds an
 * absolute root path, so it must not be committed. The managed-file manifest is
 * the exception, since it holds no absolute paths and is useful to track. Only
 * an existing `.gitignore` is edited; a repo without one is left alone.
 */

import fs from 'node:fs';
import path from 'node:path';

/** The block appended to a consumer's `.gitignore`. */
export const DBX_GITIGNORE_BLOCK = [
    '# @deltabox/toolchain (generated state; keep only the manifest)',
    '.dbx/*',
    '!.dbx/toolchain',
    '.dbx/toolchain/*',
    '!.dbx/toolchain/manifest.json',
].join('\n');

/**
 * Append the `.dbx` ignore block to `<cwd>/.gitignore` when the file exists and
 * does not already mention `.dbx`. Returns whether the file changed.
 */
export function ensureDbxGitignore(cwd: string): boolean {
    const file = path.join(cwd, '.gitignore');
    let content: string;
    try {
        content = fs.readFileSync(file, 'utf-8');
    } catch {
        return false;
    }
    if (content.includes('.dbx')) return false;
    const eol = content.includes('\r\n') ? '\r\n' : '\n';
    const block = DBX_GITIGNORE_BLOCK.split('\n').join(eol);
    const separator = content === '' || content.endsWith('\n') ? eol : `${eol}${eol}`;
    fs.writeFileSync(file, `${content}${separator}${block}${eol}`, 'utf-8');
    return true;
}
