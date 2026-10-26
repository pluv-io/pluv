import type { IODefs } from "./IODefs";
import type { IOStorageEdit } from "./types";

type ClientClock = readonly [string, number];

type Reservation<T extends IODefs> = IOStorageEdit<T> & {
    seq: number;
    version: readonly ClientClock[];
};

const covers = (doc: ReadonlyMap<string, number>, version: readonly ClientClock[]): boolean => {
    for (const [id, clock] of version) {
        if ((doc.get(id) ?? 0) < clock) return false;
    }

    return true;
};

/**
 * Same-client updates leave in clock order. Updates from different clients keep
 * the order their groups first arrived. Counters from different clients are not
 * comparable.
 */
const orderCovered = <T extends IODefs>(ready: readonly Reservation<T>[]): IOStorageEdit<T>[] => {
    const groups = new Map<string, Reservation<T>[]>();

    for (const item of ready) {
        const key = item.version.length === 1 ? item.version[0][0] : `\0${item.seq}`;
        const group = groups.get(key);

        if (group) group.push(item);
        else groups.set(key, [item]);
    }

    return (
        [...groups.values()]
            // oxlint-disable-next-line unicorn/no-array-sort -- the spread is already a new array
            .sort(
                (left, right) =>
                    Math.min(...left.map((item) => item.seq)) -
                    Math.min(...right.map((item) => item.seq)),
            )
            .flatMap((group) =>
                group
                    .toSorted((left, right) => {
                        const leftClock = left.version[0]?.[1] ?? 0;
                        const rightClock = right.version[0]?.[1] ?? 0;

                        if (
                            left.version.length === 1 &&
                            right.version.length === 1 &&
                            leftClock !== rightClock
                        ) {
                            return leftClock - rightClock;
                        }

                        return left.seq - right.seq;
                    })
                    .map(({ operator, procedure, update, user }) => ({
                        operator,
                        procedure,
                        update,
                        user,
                    })),
            )
    );
};

/** Bytes waiting until the document version covers them. Not an edit yet. */
export class StorageReservations<T extends IODefs = IODefs> {
    private _bytes = 0;
    private _items: Reservation<T>[] = [];
    private _seq = 0;

    /** `0` keeps every waiting update. A positive cap matches the document size limit. */
    constructor(private readonly _maxBytes = 0) {}

    public add(input: IOStorageEdit<T> & { version: readonly ClientClock[] }): void {
        const bytes = input.update.length;

        // One update larger than the document limit is never retained.
        if (this._maxBytes > 0 && bytes > this._maxBytes) return;

        this._seq += 1;
        this._items.push({ ...input, seq: this._seq });
        this._bytes += bytes;
    }

    public clear(): void {
        this._bytes = 0;
        this._items = [];
    }

    public holds(update: string): boolean {
        return this._items.some((item) => item.update === update);
    }

    public takeCovered(
        doc: ReadonlyMap<string, number>,
        contained: (update: string) => boolean,
    ): IOStorageEdit<T>[] {
        const ready: Reservation<T>[] = [];
        const waiting: Reservation<T>[] = [];

        for (const item of this._items) {
            // `covers` is first, so `contained` runs only after the clock check passes.
            // A delete-only update has an empty clock list. Yjs then snapshots the
            // document on every note until that update is contained.
            if (covers(doc, item.version) && contained(item.update)) {
                ready.push(item);
                this._bytes -= item.update.length;
            } else waiting.push(item);
        }

        this._items = waiting;

        return orderCovered(ready);
    }

    /**
     * Drop the oldest waiting updates until the retained bytes fit. Call this after
     * the covered ones are admitted. The apply runs between `add` and that
     * admission, so trimming inside `add` drops an update the apply is about to
     * make reportable.
     */
    public trim(): void {
        while (this._maxBytes > 0 && this._bytes > this._maxBytes && this._items.length > 1) {
            const oldest = this._items.shift();

            if (!oldest) return;

            this._bytes -= oldest.update.length;
        }
    }
}
