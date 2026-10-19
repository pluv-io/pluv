/**
 * Runs tasks one at a time while `known` is false.
 * Once `known` returns true, tasks run immediately.
 * A task already running here cannot call `run`; that waits for itself.
 */
export class ExclusiveUntil {
    private _tail: Promise<void> = Promise.resolve();

    public constructor(private readonly known: () => boolean) {}

    public async run<T>(task: () => Promise<T>): Promise<T> {
        if (this.known()) return task();

        const previous = this._tail;
        let release!: () => void;

        this._tail = new Promise<void>((resolve) => {
            release = resolve;
        });

        await previous;

        if (this.known()) {
            release();

            return task();
        }

        try {
            return await task();
        } finally {
            release();
        }
    }
}
