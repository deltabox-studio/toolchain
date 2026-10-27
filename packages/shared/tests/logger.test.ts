import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    createLogger,
    getLogger,
    isLogLevel,
    normalizeLogLevel,
    setLogConfig,
    setLogOverrides,
    stripAnsi,
} from '../src/index.js';

/** Capture stdout/stderr into arrays for the duration of a test. */
function capture() {
    const out: string[] = [];
    const err: string[] = [];
    const write = (sink: string[]) => {
        return ((chunk: unknown) => {
            sink.push(String(chunk));
            return true;
        }) as never;
    };
    const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation(write(out));
    const errSpy = vi.spyOn(process.stderr, 'write').mockImplementation(write(err));
    return {
        out,
        err,
        /** Everything written to stdout/stderr, ANSI stripped. */
        all: () => stripAnsi([...out, ...err].join('')),
        restore: () => {
            outSpy.mockRestore();
            errSpy.mockRestore();
        },
    };
}

describe('logger', () => {
    let cap: ReturnType<typeof capture>;

    beforeEach(() => {
        cap = capture();
    });

    afterEach(() => {
        cap.restore();
        setLogOverrides({});
        setLogConfig(undefined);
    });

    it('prefixes non-indented lines and leaves indented ones alone', () => {
        const log = createLogger({ name: 'dbx', color: false });
        log.info('hello');
        log.info('  - sub');
        expect(cap.all()).toContain('dbx: hello');
        expect(cap.all()).toContain('  - sub');
        expect(cap.all()).not.toContain('dbx:   - sub');
    });

    it('renders human output through clack (level symbols)', () => {
        const log = createLogger({ name: 'dbx', color: false });
        log.success('done');
        log.warn('careful');
        log.error('boom');
        expect(cap.all()).toContain('dbx: done');
        expect(cap.all()).toContain('dbx: careful');
        expect(cap.all()).toContain('dbx: boom');
    });

    it('honours the level threshold', () => {
        const log = createLogger({ level: 'warn', color: false });
        log.debug('nope');
        log.info('nope');
        log.warn('yes');
        log.error('boom');
        expect(cap.out).toEqual([]);
        expect(cap.err.join('')).toContain('yes');
        expect(cap.err.join('')).toContain('boom');
    });

    it('writes raw output without a prefix or decoration', () => {
        const log = createLogger({ name: 'dbx', color: false });
        log.raw('{"a":1}');
        expect(cap.out).toEqual(['{"a":1}\n']);
    });

    it('writes raw errors to stderr without a prefix', () => {
        const log = createLogger({ name: 'dbx', color: false });
        log.rawError('boom');
        expect(cap.out).toEqual([]);
        expect(cap.err).toEqual(['boom\n']);
    });

    it('writes verbatim text to a channel without adding a newline', () => {
        const log = createLogger({ name: 'dbx', color: false });
        log.write('out', 'help\n');
        log.write('err', 'error\n');
        expect(cap.out).toEqual(['help\n']);
        expect(cap.err).toEqual(['error\n']);
    });

    it('strips ANSI escape codes', () => {
        expect(stripAnsi('\u001b[31mred\u001b[39m plain')).toBe('red plain');
    });

    it('lets CLI overrides win over the config', () => {
        setLogConfig({ level: 'warn' });
        setLogOverrides({ level: 'debug', color: false });
        expect(getLogger().level).toBe('debug');
        getLogger().info('shown');
        expect(cap.all()).toContain('dbx: shown');
    });

    it('falls back to info for an unknown level', () => {
        setLogConfig({ level: 'nonsense' as never });
        expect(getLogger().level).toBe('info');
    });

    it('rejects inherited object keys as levels', () => {
        expect(isLogLevel('toString')).toBe(false);
        expect(isLogLevel('constructor')).toBe(false);
        expect(normalizeLogLevel('toString')).toBe('info');
    });

    it('suppresses warnings/errors by id, substring or regex', () => {
        const log = createLogger({
            name: 'dbx',
            color: false,
            suppress: ['biome.oxc-conflict', 'deprecated', '/^boom/'],
        });
        log.warn('both are configured', 'biome.oxc-conflict');
        log.warn('a deprecated option');
        log.error('boom!');
        log.warn('keep this');
        expect(cap.all()).not.toContain('both are configured');
        expect(cap.all()).not.toContain('a deprecated option');
        expect(cap.all()).not.toContain('boom!');
        expect(cap.all()).toContain('keep this');
    });
});
