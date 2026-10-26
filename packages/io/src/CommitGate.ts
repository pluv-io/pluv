/**
 * Orders one commit after another.
 * `idle` means the latest reserved turn has already finished.
 * `reserve` takes the next turn. `previous` settles when the earlier turn
 * finishes. `finish` runs once, when this turn's commit has ended.
 */
export class CommitGate {
    #turn: { done: boolean; promise: Promise<void> } = {
        done: true,
        promise: Promise.resolve(),
    };

    public get idle(): boolean {
        return this.#turn.done;
    }

    public reserve(): { previous: Promise<void>; finish: () => void } {
        const previous = this.#turn.promise;
        let settled = false;
        let resolveTurn: () => void = () => undefined;
        const promise = new Promise<void>((resolve) => {
            resolveTurn = resolve;
        });
        const turn = { done: false, promise };
        const finish = (): void => {
            if (settled) return;

            settled = true;
            turn.done = true;
            resolveTurn();
        };

        this.#turn = turn;

        return { previous, finish };
    }
}
