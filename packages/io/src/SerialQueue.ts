/**
 * Runs async tasks one at a time.
 * A task already running here cannot wait on `run`; that waits for itself.
 * `finish` is how a task waits for a promise and then comes back.
 */
export class SerialQueue {
    private _tail: Promise<void> = Promise.resolve();

    /**
     * Runs `task` on this queue. `{ value }` is passed to `commit` before the
     * task releases. `{ pending }` is awaited after it releases, and `commit`
     * runs on the next `run`. `{ $suspended: true }` releases the queue and does
     * not run `commit`.
     */
    public async finish<TValue>(
        task: () => Promise<
            { pending: Promise<TValue> } | { value: TValue } | { $suspended: true }
        >,
        commit: (value: TValue) => Promise<void>,
    ): Promise<void> {
        const deferred: { pending: Promise<TValue> | null } = { pending: null };

        await this.run(async () => {
            const result = await task();

            if ("$suspended" in result) return;

            if ("pending" in result) {
                deferred.pending = result.pending;

                return;
            }

            await commit(result.value);
        });

        if (!deferred.pending) return;

        const value = await deferred.pending;

        await this.run(() => commit(value));
    }

    public run<TResult>(task: () => Promise<TResult>): Promise<TResult> {
        const started = this._tail.then(task, task);

        this._tail = started.then(
            () => undefined,
            () => undefined,
        );

        return started;
    }
}
