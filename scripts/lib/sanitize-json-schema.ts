/**
 * JSON Schema keywords Zod's `fromJSONSchema` cannot represent. Vendored vendor
 * schemas (GitHub/GitLab/Azure, Oxfmt/Oxlint) use some of them, so the
 * generators normalize the schema before handing it to Zod.
 */
const UNSUPPORTED = new Set([
    'not',
    'if',
    'then',
    'else',
    'dependentSchemas',
    'dependentRequired',
    'unevaluatedProperties',
    'propertyNames',
    'contains',
    'minContains',
    'maxContains',
    'contentEncoding',
    'contentMediaType',
]);

/**
 * Drop the keywords Zod cannot model. `patternProperties` (used by GitLab and
 * Oxlint for arbitrary keys) is folded into `additionalProperties` so the shape
 * stays open instead of losing it entirely.
 */
export function sanitizeJsonSchema(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(sanitizeJsonSchema);
    if (!node || typeof node !== 'object') return node;
    const obj = node as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (UNSUPPORTED.has(key)) continue;
        if (key === 'patternProperties' && value && typeof value === 'object') {
            const values = Object.values(value as Record<string, unknown>);
            const existing = out.additionalProperties;
            const merged = existing === undefined ? values : [existing, ...values];
            out.additionalProperties =
                merged.length === 1
                    ? sanitizeJsonSchema(merged[0])
                    : { anyOf: merged.map(sanitizeJsonSchema) };
            continue;
        }
        out[key] = sanitizeJsonSchema(value);
    }
    return out;
}
