const STORAGE_DIFF_ATTEMPT_LIMIT = 8;

/**
 * Holds remote storage updates until the document has loaded, and limits catch-up requests.
 */
export class StorageSync {
    private _attempts = 0;
    private _queue: string[] = [];
    private _ready = false;

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

    public clearAttempts(): void {
        this._attempts = 0;
    }

    public canRequest(): boolean {
        return this._attempts < STORAGE_DIFF_ATTEMPT_LIMIT;
    }

    public recordRequest(): void {
        this._attempts += 1;
    }

    public reset(): void {
        this._attempts = 0;
        this._queue = [];
        this._ready = false;
    }

    private _takeQueue(): readonly string[] {
        const queued = this._queue.splice(0);

        if (queued.length) this._attempts = 0;

        return queued;
    }
}
