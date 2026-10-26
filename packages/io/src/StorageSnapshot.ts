import type { CrdtDocLike } from "@pluv/types";
import type { PluvIOLimits, SnapshotFlush } from "./types";
import { oneLine } from "./utils";

/** A write during the snapshot, a write from `onStorageSnapshot`, or a document past the size limit. */
type StoreInfo = {
    duringNotify: boolean;
    duringSnapshot: boolean;
    oversized: boolean;
};

/**
 * The room's snapshot. The document stays live. This copies it when asked.
 * The session manager owns the clock.
 */
export class StorageSnapshot<TContext> {
    private _closed = false;
    private _dirty = false;
    private _epoch = 0;
    private _generation = 0;
    private _hold = 0;
    private _pending: string[] = [];
    private _release: (() => void) | null = null;
    private _unsubscribe: (() => void) | null = null;
    private _untilClean: Promise<void> | null = null;

    private readonly _getContext: () => Promise<TContext>;
    private readonly _getDoc: () => Promise<CrdtDocLike<any, any>>;
    private readonly _keepAlive: (promise: Promise<unknown>) => void;
    private readonly _limits: Pick<PluvIOLimits, "storageMaxSize">;
    private readonly _onStored: (event: {
        context: TContext;
        encodedState: string;
        room: string;
    }) => void;
    private readonly _room: string;
    private readonly _setStorageState: (encodedState: string) => Promise<unknown>;

    constructor(config: {
        getContext: () => Promise<TContext>;
        getDoc: () => Promise<CrdtDocLike<any, any>>;
        keepAlive: (promise: Promise<unknown>) => void;
        limits: Pick<PluvIOLimits, "storageMaxSize">;
        onStored: (event: { context: TContext; encodedState: string; room: string }) => void;
        room: string;
        setStorageState: (encodedState: string) => Promise<unknown>;
    }) {
        this._getContext = config.getContext;
        this._getDoc = config.getDoc;
        this._keepAlive = config.keepAlive;
        this._limits = config.limits;
        this._onStored = config.onStored;
        this._room = config.room;
        this._setStorageState = config.setStorageState;
    }

    public get closed(): boolean {
        return this._closed;
    }

    public get dirty(): boolean {
        return this._dirty && !this._closed;
    }

    /** Updates still need a `$storageUpdated` frame. A closed room does not retry them. */
    public get hasPending(): boolean {
        return !this._closed && this._pending.length > 0;
    }

    public get epoch(): number {
        return this._epoch;
    }

    /** Increments in `seal`. Stays put across `reopen`. */
    public get generation(): number {
        return this._generation;
    }

    /** The seed snapshot already stored this epoch. A later write still needs a copy. */
    public acknowledge(epoch: number): void {
        if (this._epoch === epoch) this._markClean();
    }

    public assertSize(encodedState: string): void {
        if (!this._exceedsLimit(encodedState)) return;

        const limit = this._limits.storageMaxSize ?? 0;
        const storageSize = new TextEncoder().encode(encodedState).length;

        throw new Error(oneLine`
            Large Storage. Storage must be at most
            ${limit.toLocaleString()} bytes.
            Current size: ${storageSize.toLocaleString()} bytes
        `);
    }

    public attach(doc: CrdtDocLike<any, any>): void {
        this.detach();
        this._unsubscribe = doc.subscribe((notice) => {
            if (!notice.update) return;

            this._epoch += 1;
            this._markDirty();

            if (this._hold > 0 || this._closed) return;

            this._pending.push(notice.update);
        });
    }

    public detach(): void {
        this._unsubscribe?.();
        this._unsubscribe = null;
    }

    public async flush(): Promise<SnapshotFlush> {
        if (this._closed) return "closed";
        if (!this._dirty) return "clean";

        const doc = await this._getDoc();
        const context = await this._getContext();

        if (this._closed) return "closed";
        if (!this._dirty) return "clean";

        const stored = await this._store({ context, doc, notify: true });

        if (this._closed) return "closed";
        if (stored.oversized || (!stored.duringNotify && !stored.duringSnapshot)) {
            this._markClean();

            return "clean";
        }

        // The listener's write is stored next. That snapshot does not call the listener
        // again, so a write on every snapshot cannot keep this clock alive.
        const follow = await this._store({ context, doc, notify: false });

        if (this._closed) return "closed";
        if (follow.oversized || !follow.duringSnapshot) {
            this._markClean();

            return "clean";
        }

        this._markDirty();

        return "dirty";
    }

    /** Doc updates inside `fn` mark the snapshot stale and do not broadcast again. */
    public hold<TResult>(fn: () => TResult): TResult {
        this._hold += 1;

        try {
            return fn();
        } finally {
            this._hold -= 1;
        }
    }

    /** An update made inside `hold` still needs a `$storageUpdated` frame. */
    public queueUpdate(update: string): void {
        if (this._closed || update.length === 0) return;

        this._pending.push(update);
    }

    /** Drop updates whose `$storageUpdated` frames were delivered. */
    public dropUpdates(updates: readonly string[]): void {
        if (updates.length === 0 || this._pending.length === 0) return;

        const remaining = new Map<string, number>();

        for (const update of updates) {
            remaining.set(update, (remaining.get(update) ?? 0) + 1);
        }

        this._pending = this._pending.filter((update) => {
            const count = remaining.get(update);

            if (!count) return true;

            if (count === 1) remaining.delete(update);
            else remaining.set(update, count - 1);

            return false;
        });
    }

    /** A copy of the updates that still need a `$storageUpdated` frame. */
    public pendingUpdates(): string[] {
        return [...this._pending];
    }

    public reopen(): void {
        this._closed = false;
        this._markClean();
        this._epoch = 0;
        this._hold = 0;
        this._pending = [];
    }

    public async seal(): Promise<void> {
        this._closed = true;
        this._generation += 1;

        if (!this._dirty) return;

        const doc = await this._getDoc();
        const context = await this._getContext();

        let notify = true;

        for (;;) {
            // oxlint-disable-next-line eslint/no-await-in-loop
            const stored = await this._store({ context, doc, notify });

            notify = false;

            if (stored.oversized || (!stored.duringNotify && !stored.duringSnapshot)) {
                this._markClean();

                return;
            }

            if (stored.duringSnapshot) continue;

            // oxlint-disable-next-line eslint/no-await-in-loop
            const follow = await this._store({ context, doc, notify: false });

            if (follow.oversized || !follow.duringSnapshot) {
                this._markClean();

                return;
            }
        }
    }

    private async _store(params: {
        context: TContext;
        doc: CrdtDocLike<any, any>;
        notify: boolean;
    }): Promise<StoreInfo> {
        const { context, doc, notify } = params;
        const encodedState = doc.getEncodedState();

        if (this._exceedsLimit(encodedState)) {
            this._markClean();

            return { duringNotify: false, duringSnapshot: false, oversized: true };
        }

        const epoch = this._epoch;

        await this._setStorageState(encodedState);

        const duringSnapshot = this._epoch !== epoch;
        const notifiedAt = this._epoch;

        if (notify) {
            this._onStored({
                context,
                encodedState,
                room: this._room,
            });
        }

        return {
            duringNotify: this._epoch !== notifiedAt,
            duringSnapshot,
            oversized: false,
        };
    }

    private _arm(): void {
        if (this._untilClean) return;

        let release!: () => void;
        const held = new Promise<void>((resolve) => {
            release = resolve;
        });

        this._untilClean = held;
        this._release = release;
        this._keepAlive(held);
    }

    private _exceedsLimit(encodedState: string): boolean {
        const storageSize = new TextEncoder().encode(encodedState).length;

        return !!this._limits.storageMaxSize && storageSize > this._limits.storageMaxSize;
    }

    private _markClean(): void {
        this._dirty = false;
        this._release?.();
        this._release = null;
        this._untilClean = null;
    }

    private _markDirty(): void {
        this._dirty = true;

        if (this._closed) return;

        this._arm();
    }
}
