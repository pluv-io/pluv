/**
 * Orders one commit after another.
 * `idle` means the latest reserved commit has already finished.
 * `reserve` takes the next commit. `previous` settles when the earlier commit
 * finishes. `finish` runs once, when this commit has ended.
 */
export class CommitGate {
    #commit: { done: boolean; promise: Promise<void> } = {
        done: true,
        promise: Promise.resolve(),
    };

    public get idle(): boolean {
        return this.#commit.done;
    }

    public reserve(): { previous: Promise<void>; finish: () => void } {
        const previous = this.#commit.promise;
        let settled = false;
        let resolveCommit: () => void = () => undefined;
        const promise = new Promise<void>((resolve) => {
            resolveCommit = resolve;
        });
        const commit = { done: false, promise };
        const finish = (): void => {
            if (settled) return;

            settled = true;
            commit.done = true;
            resolveCommit();
        };

        this.#commit = commit;

        return { previous, finish };
    }
}
