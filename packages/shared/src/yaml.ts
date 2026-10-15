/**
 * A tiny, dependency-free YAML emitter for the subset GitHub Actions needs:
 * nested maps, arrays (inline or block), booleans/numbers/null, and multi-line
 * block scalars (`run: |`). It is intentionally conservative — string scalars
 * that could be misread (booleans, numbers, `#`, `: `, `${{ }}`, ...) are
 * double-quoted.
 */

type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

const BOOLEAN_LIKE = /^(?:true|false|yes|no|on|off|null|~)$/i;
const NUMBER_LIKE = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;

function isMap(value: unknown): value is Record<string, YamlValue> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function quotable(s: string): boolean {
    if (s === '') return true;
    if (BOOLEAN_LIKE.test(s) || NUMBER_LIKE.test(s)) return true;
    if (/^[\s\-?:,[\]{}#&*!|>%@`"']/.test(s)) return true;
    if (/\s$/.test(s)) return true;
    if (s.includes(': ') || s.includes(' #') || s.includes('\t')) return true;
    if (s.includes('${{')) return true;
    if (/["\\]/.test(s)) return true;
    return false;
}

function scalar(value: string | number | boolean | null): string {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    if (quotable(value)) return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    return value;
}

function keyName(key: string): string {
    if (quotable(key) && !BOOLEAN_LIKE.test(key)) return `"${key}"`;
    // `on` is a valid Actions key but a YAML 1.1 boolean; leave it unquoted.
    return key;
}

function inlineArrayLength(values: YamlValue[]): number {
    return values.reduce<number>((sum, value) => sum + String(scalarOf(value)).length + 2, 0);
}

function scalarOf(value: YamlValue): string | number | boolean | null {
    return value as string | number | boolean | null;
}

function isScalar(value: YamlValue): value is string | number | boolean | null {
    return (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    );
}

function emitArray(values: YamlValue[], indent: number): string[] {
    const pad = ' '.repeat(indent);
    const lines: string[] = [];
    for (const value of values) {
        if (isScalar(value)) {
            lines.push(`${pad}- ${scalar(value)}`);
        } else if (Array.isArray(value)) {
            lines.push(`${pad}-`);
            lines.push(...emitArray(value, indent + 2));
        } else if (isMap(value)) {
            const sub = emitMap(value, indent + 2);
            const first = sub[0];
            if (first === undefined) {
                lines.push(`${pad}- {}`);
            } else {
                lines.push(`${pad}- ${first.slice(indent + 2)}`);
                for (let i = 1; i < sub.length; i += 1) lines.push(sub[i]!);
            }
        }
    }
    return lines;
}

function emitStringBlock(value: string, indent: number, pad: string, key: string): string[] {
    const body = value.endsWith('\n') ? value.slice(0, -1) : value;
    const lines = [`${pad}${key}: |`];
    for (const line of body.split('\n'))
        lines.push(line === '' ? '' : `${' '.repeat(indent + 2)}${line}`);
    return lines;
}

function emitMap(map: Record<string, YamlValue>, indent: number): string[] {
    const pad = ' '.repeat(indent);
    const lines: string[] = [];
    for (const [rawKey, value] of Object.entries(map)) {
        if (value === undefined) continue;
        const key = keyName(rawKey);
        if (typeof value === 'string' && value.includes('\n')) {
            lines.push(...emitStringBlock(value, indent, pad, key));
        } else if (isScalar(value)) {
            lines.push(`${pad}${key}: ${scalar(value)}`);
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                lines.push(`${pad}${key}: []`);
            } else if (value.every(isScalar) && inlineArrayLength(value) <= 60) {
                lines.push(`${pad}${key}: [${value.map(v => scalar(scalarOf(v))).join(', ')}]`);
            } else {
                lines.push(`${pad}${key}:`);
                lines.push(...emitArray(value, indent + 2));
            }
        } else if (isMap(value)) {
            if (Object.keys(value).length === 0) {
                lines.push(`${pad}${key}: {}`);
            } else {
                lines.push(`${pad}${key}:`);
                lines.push(...emitMap(value, indent + 2));
            }
        }
    }
    return lines;
}

/** Serialize a value (expected to be a map) to a YAML document. */
export function toYaml(value: Record<string, YamlValue>): string {
    return `${emitMap(value, 0).join('\n')}\n`;
}

export type { YamlValue };
