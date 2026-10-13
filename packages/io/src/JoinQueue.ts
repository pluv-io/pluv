/**
 * Runs async tasks one at a time.
 * A task already running here cannot wait on `join`; that waits for itself.
 * `finish` is how a task waits for a promise and then comes back.
 */
export class JoinQueue {
    private _tail: Promise<void> = Promise.resolve();

    /**
     * Runs `task` on this queue. `{ value }` is passed to `finish` before the
     * task releases. `{ pending }` is awaited after it releases, and `finish`
     * runs on the next join. `{ suspended: true }` releases the queue and does
     * not run `finish`.
     */
    public async finish<TValue>(
        task: () => Promise<{ pending: Promise<TValue> } | { value: TValue } | { suspended: true }>,
        finish: (value: TValue) => Promise<void>,
    ): Promise<void> {
        const deferred: { pending: Promise<TValue> | null } = { pending: null };

        await this.join(async () => {
            const result = await task();

            if ("suspended" in result) return;

            if ("pending" in result) {
                deferred.pending = result.pending;

                return;
            }

            await finish(result.value);
        });

        if (!deferred.pending) return;

        const value = await deferred.pending;

        await this.join(() => finish(value));
    }

    public join<TResult>(task: () => Promise<TResult>): Promise<TResult> {
        const run = this._tail.then(task, task);

        this._tail = run.then(
            () => undefined,
            () => undefined,
        );

        return run;
    }
}
