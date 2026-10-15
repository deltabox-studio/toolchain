/**
 * A debounced, loop-safe scheduler for running a sync in response to file
 * changes.
 *
 * Loop prevention is layered:
 *  1. Only *input* files are watched (never the generated outputs).
 *  2. `notify()` is ignored during a suppression window after each run, so any
 *     event caused by the sync's own writes cannot re-trigger it.
 *  3. A single run is in flight at a time; changes during a run queue exactly
 *     one follow-up run.
 */

export type SchedulerState = 'idle' | 'queued' | 'running' | 'suppressed';

export interface SchedulerOptions {
    /** Debounce window (ms), or a getter re-read on each change. */
    debounceMs: number | (() => number);
    /** The work to run (should never throw; the scheduler swallows errors). */
    run: () => Promise<void>;
    /** Called on every state transition (for a status bar, logging, ...). */
    onStateChange?: (state: SchedulerState) => void;
    /** Multiplier applied to the debounce for the post-run suppression window. */
    suppressFactor?: number;
}

export class SyncScheduler {
    private timer?: ReturnType<typeof setTimeout>;
    private running = false;
    private queued = false;
    private suppressUntil = 0;
    private disposed = false;

    constructor(private readonly options: SchedulerOptions) {}

    /** The current debounce window in ms. */
    private debounce(): number {
        return typeof this.options.debounceMs === 'function'
            ? this.options.debounceMs()
            : this.options.debounceMs;
    }

    /**
     * Signal an input change. Ignored while suppressed (the sync's own writes)
     * or after {@link dispose}.
     */
    notify(): void {
        if (this.disposed) return;
        if (Date.now() < this.suppressUntil) {
            this.options.onStateChange?.('suppressed');
            return;
        }
        this.schedule();
    }

    /** Run immediately (manual trigger), bypassing debounce + suppression. */
    async runNow(): Promise<void> {
        await this.execute();
    }

    private schedule(): void {
        this.options.onStateChange?.('queued');
        clearTimeout(this.timer);
        this.timer = setTimeout(() => void this.execute(), this.debounce());
    }

    private async execute(): Promise<void> {
        if (this.disposed) return;
        if (this.running) {
            this.queued = true;
            return;
        }
        this.running = true;
        this.options.onStateChange?.('running');
        try {
            await this.options.run();
        } catch {
            // run() is responsible for logging; never crash the scheduler.
        } finally {
            this.running = false;
            this.suppressUntil =
                Date.now() + Math.max(this.debounce() * (this.options.suppressFactor ?? 3), 500);
            this.options.onStateChange?.('idle');
            if (this.queued) {
                this.queued = false;
                this.schedule();
            }
        }
    }

    /** Stop the scheduler (clears any pending run). */
    dispose(): void {
        this.disposed = true;
        clearTimeout(this.timer);
    }
}
