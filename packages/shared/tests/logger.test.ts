import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLogger, getLogger, setLogConfig, setLogOverrides } from '../src/index.js';

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
        expect(cap.out).toEqual(['dbx: hello\n', '  - sub\n']);
    });

    it('honours the level threshold', () => {
        const log = createLogger({ level: 'warn', color: false });
        log.debug('nope');
        log.info('nope');
        log.warn('yes');
        log.error('boom');
        expect(cap.out).toEqual([]);
        expect(cap.err).toEqual(['yes\n', 'boom\n']);
    });

    it('writes raw output without a prefix', () => {
        const log = createLogger({ name: 'dbx', color: false });
        log.raw('{"a":1}');
        expect(cap.out).toEqual(['{"a":1}\n']);
    });

    it('lets CLI overrides win over the config', () => {
        setLogConfig({ level: 'warn' });
        setLogOverrides({ level: 'debug', color: false });
        expect(getLogger().level).toBe('debug');
        getLogger().info('shown');
        expect(cap.out).toEqual(['dbx: shown\n']);
    });

    it('falls back to info for an unknown level', () => {
        setLogConfig({ level: 'nonsense' as never });
        expect(getLogger().level).toBe('info');
    });
});
