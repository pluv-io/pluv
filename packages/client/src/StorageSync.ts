/**
 * Holds remote storage updates until the document has loaded, and remembers when a catch-up
 * reply did not move the document.
 */
export class StorageSync {
    private _queue: string[] = [];
    private _ready = false;
    private _stalled = false;

    public get isReady(): boolean {
        return this._ready;
    }

    public hold(update: string): void {
        this._queue.push(update);
    }

    public markReady(): readonly string[] {
        this._ready = true;

        return this._takeQueue();
    }

    public clearStall(): void {
        this._stalled = false;
    }

    /**
     * @description The first time a catch-up reply does not move the document. Later calls
     * stay quiet until `clearStall()` or `reset()`.
     */
    public noteStall(): boolean {
        if (this._stalled) return false;

        this._stalled = true;

        return true;
    }

    public reset(): void {
        this._queue = [];
        this._ready = false;
        this._stalled = false;
    }

    private _takeQueue(): readonly string[] {
        const queued = this._queue.splice(0);

        if (queued.length) this.clearStall();

        return queued;
    }
}
