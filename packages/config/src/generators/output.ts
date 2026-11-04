import path from 'node:path';

/**
 * Resolve a generated file inside `outputDir`, rejecting scope names or file
 * options that would escape it (`../`, absolute paths on another drive, ...).
 */
export function resolveGeneratedFile(outputDir: string, file: string): string {
    const root = path.resolve(outputDir);
    const target = path.resolve(root, file);
    const relative = path.relative(root, target);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`generated file "${file}" resolves outside the output directory.`);
    }
    return target;
}
