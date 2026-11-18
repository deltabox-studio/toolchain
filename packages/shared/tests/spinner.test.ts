import { afterEach, describe, expect, it } from 'vite-plus/test';

import { canShowSpinner, setSpinnerEnabled, withSpinner } from '../src/spinner.js';

const tty = { isTTY: true } as NodeJS.WriteStream;
const pipe = { isTTY: false } as NodeJS.WriteStream;

afterEach(() => setSpinnerEnabled(undefined));

describe('withSpinner', () => {
    it('detects non-interactive environments', () => {
        expect(canShowSpinner(pipe, {})).toBe(false);
        expect(canShowSpinner(tty, { CI: 'true' })).toBe(false);
        expect(canShowSpinner(tty, { NO_COLOR: '1' })).toBe(false);
        expect(canShowSpinner(tty, { TERM: 'dumb' })).toBe(false);
    });

    it('honours an explicit override', () => {
        setSpinnerEnabled(true);
        expect(canShowSpinner(pipe, { CI: 'true', NO_COLOR: '1' })).toBe(true);
        setSpinnerEnabled(false);
        expect(canShowSpinner(tty, {})).toBe(false);
    });

    it('runs the task unchanged when suppressed', async () => {
        await expect(
            withSpinner(async () => 'result', { start: 'Working', enabled: false })
        ).resolves.toBe('result');
    });

    it('rethrows a task failure when suppressed', async () => {
        await expect(
            withSpinner(
                async () => {
                    throw new Error('boom');
                },
                { start: 'Working', enabled: false }
            )
        ).rejects.toThrow('boom');
    });
});
