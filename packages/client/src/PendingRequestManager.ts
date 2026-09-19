type PendingRequest = {
    onAbort: () => unknown;
    resolve: (result: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
};

/**
 * Correlate in-flight request ids to replies on a multiplexed socket.
 */
export class PendingRequestManager {
    private readonly _waiters = new Map<string, PendingRequest>();

    public get size(): number {
        return this._waiters.size;
    }

    public request<TResult>(params: {
        onAbort: () => TResult;
        onTimeout: () => TResult;
        timeoutMs: number;
    }): { promise: Promise<TResult>; requestId: string } {
        const requestId = globalThis.crypto.randomUUID();
        const promise = new Promise<TResult>((resolve) => {
            const timeoutId = setTimeout(() => {
                this.complete(requestId, params.onTimeout());
            }, params.timeoutMs);

            this._waiters.set(requestId, {
                onAbort: params.onAbort,
                resolve: resolve as (result: unknown) => void,
                timeoutId,
            });
        });

        return { promise, requestId };
    }

    public complete(requestId: string, result: unknown): boolean {
        const pending = this._waiters.get(requestId) ?? null;

        if (!pending) return false;

        this._waiters.delete(requestId);
        clearTimeout(pending.timeoutId);
        pending.resolve(result);

        return true;
    }

    public failAll(): void {
        Array.from(this._waiters.entries()).forEach(([requestId, pending]) => {
            this.complete(requestId, pending.onAbort());
        });
    }
}
