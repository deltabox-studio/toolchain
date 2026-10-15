import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncScheduler } from '../src/sync-scheduler.js';

describe('SyncScheduler', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('debounces bursts of changes into a single run', async () => {
        const run = vi.fn(async () => {});
        const scheduler = new SyncScheduler({ debounceMs: 100, run });
        scheduler.notify();
        scheduler.notify();
        scheduler.notify();
        await vi.advanceTimersByTimeAsync(99);
        expect(run).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(run).toHaveBeenCalledTimes(1);
        scheduler.dispose();
    });

    it('queues exactly one follow-up when changes arrive mid-run (no overlap, no pile-up)', async () => {
        const resolvers: (() => void)[] = [];
        const run = vi.fn(
            () =>
                new Promise<void>(resolve => {
                    resolvers.push(resolve);
                })
        );
        const scheduler = new SyncScheduler({ debounceMs: 50, run });

        scheduler.notify();
        await vi.advanceTimersByTimeAsync(50); // run #1 starts
        expect(run).toHaveBeenCalledTimes(1);

        scheduler.notify(); // several changes while running...
        scheduler.notify();
        scheduler.notify();
        await vi.advanceTimersByTimeAsync(50); // debounce fires while running -> queued once

        resolvers[0]!(); // finish run #1
        await vi.advanceTimersByTimeAsync(50); // the single follow-up (run #2) starts
        expect(run).toHaveBeenCalledTimes(2);

        resolvers[1]!();
        await vi.runOnlyPendingTimersAsync();
        expect(run).toHaveBeenCalledTimes(2); // no extra runs
        scheduler.dispose();
    });

    it('suppresses notifications right after a run (prevents endless loops)', async () => {
        const run = vi.fn(async () => {});
        const scheduler = new SyncScheduler({ debounceMs: 100, run });

        scheduler.notify();
        await vi.advanceTimersByTimeAsync(100);
        expect(run).toHaveBeenCalledTimes(1);

        // The sync's own writes emit events immediately after the run: ignored.
        scheduler.notify();
        await vi.advanceTimersByTimeAsync(100);
        expect(run).toHaveBeenCalledTimes(1);

        // After the suppression window, a genuine change runs again.
        await vi.advanceTimersByTimeAsync(1000);
        scheduler.notify();
        await vi.advanceTimersByTimeAsync(100);
        expect(run).toHaveBeenCalledTimes(2);
        scheduler.dispose();
    });

    it('runNow executes immediately (manual command)', async () => {
        const run = vi.fn(async () => {});
        const scheduler = new SyncScheduler({ debounceMs: 100, run });
        await scheduler.runNow();
        expect(run).toHaveBeenCalledTimes(1);
        scheduler.dispose();
    });

    it('reports state transitions', async () => {
        const states: string[] = [];
        const scheduler = new SyncScheduler({
            debounceMs: 10,
            run: async () => {},
            onStateChange: s => states.push(s),
        });
        scheduler.notify();
        await vi.advanceTimersByTimeAsync(10);
        expect(states).toEqual(['queued', 'running', 'idle']);
        scheduler.dispose();
    });

    it('ignores changes after dispose', async () => {
        const run = vi.fn(async () => {});
        const scheduler = new SyncScheduler({ debounceMs: 10, run });
        scheduler.dispose();
        scheduler.notify();
        await vi.advanceTimersByTimeAsync(100);
        expect(run).not.toHaveBeenCalled();
    });
});
