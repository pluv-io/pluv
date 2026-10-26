/**
 * Runs `commit` after earlier commits. `ready` should already be running.
 * A rejection, or a throw from `commit`, is logged, and the next call still runs.
 * The storage caller returns before the write. This promise only orders the next commit.
 */
export const sequenceCommit = <T>(params: {
    tail: Promise<void>;
    ready: Promise<T>;
    commit: (value: T) => void;
}): Promise<void> => {
    const turn = params.tail.then(() => params.ready);

    return turn.then(
        (value) => {
            try {
                params.commit(value);
            } catch (error) {
                console.error(error);
            }
        },
        (error: unknown) => {
            console.error(error);
        },
    );
};
