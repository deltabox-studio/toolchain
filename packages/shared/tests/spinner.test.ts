import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { logger, setLogConfig, setLogOverrides, stripAnsi } from '../src/index.js';
import { canShowSpinner, setSpinnerEnabled, withSpinner } from '../src/spinner.js';

const tty = { isTTY: true } as NodeJS.WriteStream;
const pipe = { isTTY: false } as NodeJS.WriteStream;

/** Capture stdout (spinner frames + log lines) for the duration of a test. */
function capture(): { text(): string; raw(): string; restore(): void } {
    const chunks: string[] = [];
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
        chunks.push(String(chunk));
        return true;
    }) as never);
    return {
        text: () => stripAnsi(chunks.join('')),
        raw: () => chunks.join(''),
        restore: () => spy.mockRestore(),
    };
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

describe('withSpinner', () => {
    let cap: ReturnType<typeof capture>;

    beforeEach(() => {
        cap = capture();
    });

    afterEach(() => {
        cap.restore();
        setSpinnerEnabled(undefined);
        setLogOverrides({});
        setLogConfig(undefined);
    });

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

    it('suppresses the spinner for a silent logger config', () => {
        setLogConfig({ level: 'silent' });
        expect(canShowSpinner(tty, {})).toBe(false);
    });

    it('keeps NO_COLOR intact when a config without a colour setting loads', () => {
        const previous = process.env.NO_COLOR;
        process.env.NO_COLOR = '1';
        try {
            setLogConfig(undefined);
            expect(process.env.NO_COLOR).toBe('1');
            expect(canShowSpinner(tty, process.env)).toBe(false);
        } finally {
            if (previous === undefined) delete process.env.NO_COLOR;
            else process.env.NO_COLOR = previous;
            setLogConfig(undefined);
        }
    });

    it('renders a start and success state on a TTY', async () => {
        await expect(
            withSpinner(
                async () => {
                    await delay(120);
                    return 'result';
                },
                { start: 'Working...', success: 'Worked.', enabled: true }
            )
        ).resolves.toBe('result');
        // clack strips trailing dots from spinner messages.
        expect(cap.text()).toContain('Working');
        expect(cap.text()).toContain('Worked');
    });

    it('shows the failure message and rethrows', async () => {
        await expect(
            withSpinner(
                async () => {
                    await delay(120);
                    throw new Error('boom');
                },
                { start: 'Working...', fail: 'Failed hard.', enabled: true }
            )
        ).rejects.toThrow('boom');
        expect(cap.text()).toContain('Working');
        expect(cap.text()).toContain('Failed hard.');
        expect(cap.text()).not.toContain('Worked.');
    });

    it('keeps logger output readable while the spinner runs', async () => {
        await withSpinner(
            async () => {
                await delay(120);
                logger.info('task line');
                await delay(120);
            },
            { start: 'Working...', success: 'Worked.', enabled: true }
        );
        const text = cap.text();
        expect(text).toContain('dbx: task line');
        expect(text).toContain('Worked.');
        // The animation was cleared before the log line was written.
        const raw = cap.raw();
        const index = raw.indexOf('dbx: task line');
        const before = raw.slice(Math.max(0, index - 80), index);
        expect(before).toContain('\u001b[1G');
        expect(before).toContain('\u001b[J');
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
