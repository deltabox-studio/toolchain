/**
 * Misspelling suggestions for invalid argv.
 */

/** Levenshtein distance used for misspelling suggestions. */
export function editDistance(a: string, b: string): number {
    const rows = a.length + 1;
    const columns = b.length + 1;
    let previous = Array.from({ length: columns }, (_, index) => index);
    for (let row = 1; row < rows; row++) {
        const current = [row];
        for (let column = 1; column < columns; column++) {
            current[column] =
                a[row - 1] === b[column - 1]
                    ? previous[column - 1]!
                    : 1 + Math.min(previous[column - 1]!, previous[column]!, current[column - 1]!);
        }
        previous = current;
    }
    return previous[columns - 1]!;
}

/** The closest candidate, when it is close enough to be a useful suggestion. */
export function suggest(input: string, candidates: readonly string[]): string | undefined {
    const normalized = input.replace(/^-+/, '');
    let best: { candidate: string; distance: number } | undefined;
    for (const candidate of candidates) {
        if (typeof candidate !== 'string') continue;
        const distance = editDistance(normalized, candidate.replace(/^-+/, ''));
        if (!best || distance < best.distance) best = { candidate, distance };
    }
    if (!best) return undefined;
    const limit = Math.max(2, Math.floor(normalized.length / 3));
    return best.distance <= limit ? best.candidate : undefined;
}
