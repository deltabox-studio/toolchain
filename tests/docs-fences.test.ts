import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const root = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.yarn', '.turbo', '.vitepress']);

function markdownFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            files.push(...markdownFiles(path.join(dir, entry.name)));
            continue;
        }
        if (/\.(md|mdx)$/i.test(entry.name)) files.push(path.join(dir, entry.name));
    }
    return files;
}

interface OpenFence {
    char: string;
    length: number;
    line: number;
}

/** A short (one/two backtick) fence opener such as `` `ts ``. */
const SHORT_FENCE_OPENER = /^\s*`{1,2}[A-Za-z0-9_+.-]*\s*$/;

/** Report invalid/short/unclosed fences in one markdown file. */
function fenceIssues(file: string): string[] {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const issues: string[] = [];
    let open: OpenFence | undefined;

    lines.forEach((line, index) => {
        const match = /^(\s*)(`{1,}|~{1,})(.*)$/.exec(line);
        if (!match) return;
        const run = match[2]!;
        const rest = match[3] ?? '';

        if (!open) {
            if (run.length >= 3) {
                // A backtick fence's info string cannot contain a backtick.
                if (run[0] === '`' && rest.includes('`')) {
                    issues.push(`${file}:${index + 1} fence info string contains a backtick`);
                }
                open = { char: run[0]!, length: run.length, line: index + 1 };
                return;
            }
            if (SHORT_FENCE_OPENER.test(line)) {
                issues.push(
                    `${file}:${index + 1} uses ${run.length} backtick(s) as a fence opener`
                );
            }
            return;
        }

        // Only the opening character can close the fence.
        if (run[0] !== open.char || !/^\s*$/.test(rest)) return;
        if (run.length >= open.length) {
            open = undefined;
            return;
        }
        // A shorter run of three or more is valid nested content (a four-backtick
        // fence can contain three-backtick examples). One or two is the typo we
        // want to catch.
        if (run.length <= 2) {
            issues.push(
                `${file}:${index + 1} uses ${run.length} backtick(s) to close a ` +
                    `${open.length}-backtick fence`
            );
        }
    });

    if (open) {
        issues.push(`${file}:${open.line} has an unclosed ${open.char.repeat(open.length)} fence`);
    }
    return issues;
}

describe('documentation code fences', () => {
    it('uses balanced, valid fences in every markdown file', () => {
        const files = markdownFiles(root);
        const issues = files.flatMap(fenceIssues).map(issue => issue.slice(root.length + 1));

        expect(issues).toEqual([]);
    });
});
