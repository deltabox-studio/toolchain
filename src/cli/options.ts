import { camelCase } from '@deltabox/toolchain-shared';

/** Extract the (camelCased) long option keys from a commander flags string. */
export function optionKeys(flags: string): string[] {
    const keys: string[] = [];
    for (const segment of flags.split(',')) {
        const match = segment.trim().match(/^--(?:no-)?([^ <]+)/);
        if (match?.[1]) keys.push(camelCase(match[1]));
    }
    return keys;
}
