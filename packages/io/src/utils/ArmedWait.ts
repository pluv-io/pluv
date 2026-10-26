/**
 * The first `arm` starts one wait. Another `arm` during that wait does nothing.
 * When the wait ends, `work` runs. `keepAlive` covers the wait and that work.
 * `clear` cancels a pending wait and settles `keepAlive` without running `work`.
 */
export class ArmedWait {
    private _done: (() => void) | null = null;
    private _timer: ReturnType<typeof setTimeout> | null = null;

    public constructor(
        private readonly _intervalMs: number,
        private readonly _keepAlive: (promise: Promise<unknown>) => void,
    ) {}

    public arm(work: () => Promise<void>): void {
        if (this._timer) return;

        const pending = new Promise<void>((resolve) => {
            this._done = resolve;
            this._timer = setTimeout(() => {
                this._timer = null;
                this._done = null;
                void work().finally(resolve);
            }, this._intervalMs);
        });

        this._keepAlive(pending);
    }

    public clear(): void {
        if (!this._timer) return;

        clearTimeout(this._timer);
        this._timer = null;
        const done = this._done;

        this._done = null;
        done?.();
    }
}
