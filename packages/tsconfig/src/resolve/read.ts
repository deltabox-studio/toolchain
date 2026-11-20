/** Reading and parsing JSONC tsconfig files. */

import fs from 'node:fs';
import path from 'node:path';

import { isRemoteUrl, readRemoteTsconfig } from '../remote.js';
import type { TsconfigJson } from '../types/index.js';
import type { TsconfigContents } from './types.js';

/** In-memory contents for one local file, when injected by a caller. */
export function contentFor(
    contents: TsconfigContents | undefined,
    file: string
): string | undefined {
    if (!contents || isRemoteUrl(file)) return undefined;
    const key = path.resolve(file);
    return contents instanceof Map ? contents.get(key) : (contents as Record<string, string>)[key];
}

export function stripComments(input: string): string {
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i] as string;
        const next = input[i + 1];
        if (inString) {
            out += ch;
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            out += ch;
            continue;
        }
        if (ch === '/' && next === '/') {
            while (i < input.length && input[i] !== '\n') i++;
            out += '\n';
            continue;
        }
        if (ch === '/' && next === '*') {
            i += 2;
            while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++;
            i++;
            continue;
        }
        out += ch;
    }
    return out;
}

export function stripTrailingCommas(input: string): string {
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i] as string;
        if (inString) {
            out += ch;
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            out += ch;
            continue;
        }
        if (ch === ',') {
            let j = i + 1;
            while (j < input.length && /\s/.test(input[j] as string)) j++;
            if (input[j] === '}' || input[j] === ']') continue;
        }
        out += ch;
    }
    return out;
}

/** Read a tsconfig file (JSONC: comments + trailing commas are allowed). */
export function readTsconfig(file: string): TsconfigJson {
    return parseTsconfig(fs.readFileSync(file, 'utf-8'));
}

/** Parse JSONC tsconfig text (comments, trailing commas and a BOM are allowed). */
export function parseTsconfig(text: string): TsconfigJson {
    return JSON.parse(
        stripTrailingCommas(stripComments(text.replace(/^\uFEFF/, '')))
    ) as TsconfigJson;
}

/** Whether a path points at an existing regular file. */
export function isFile(file: string): boolean {
    try {
        return fs.statSync(file).isFile();
    } catch {
        return false;
    }
}

/** Read a tsconfig (local or prefetched remote) with a useful failure message. */
export function readConfig(file: string, contents?: TsconfigContents): TsconfigJson {
    if (isRemoteUrl(file)) return readRemoteTsconfig(file);
    const injected = contentFor(contents, file);
    try {
        return injected !== undefined ? parseTsconfig(injected) : readTsconfig(file);
    } catch (error) {
        throw new Error(
            `Cannot parse tsconfig "${file}": ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
