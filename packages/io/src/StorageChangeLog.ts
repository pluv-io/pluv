import type { CrdtDocLike, MaybePromise } from "@pluv/types";
import type { IODefs } from "./IODefs";
import type { IOStorageEdit, IOStorageEditsEvent } from "./types";

type EditCaller<T extends IODefs> = {
    operator: IOStorageEdit<T>["operator"];
    procedure: string | null;
    user: IOStorageEdit<T>["user"];
};

/**
 * Ordered document edits for `onStorageEdits`. The first edit starts the wait.
 * Edits during that wait join the same list. A room with no listener does not
 * construct this.
 */
export class StorageChangeLog<T extends IODefs = IODefs> {
    private _changes: IOStorageEdit<T>[] = [];
    private _closed = false;
    private _queue: Promise<void> = Promise.resolve();
    private _timer: ReturnType<typeof setTimeout> | null = null;
    private _timerDone: (() => void) | null = null;
    private _unsubscribe: (() => void) | null = null;

    private readonly _caller: (origin: string | null) => EditCaller<T> | null;
    private readonly _getContext: () => Promise<T["context"]>;
    private readonly _interval: number;
    private readonly _keepAlive: (promise: Promise<unknown>) => void;
    private readonly _onEdits: (event: IOStorageEditsEvent<T>) => MaybePromise<void>;
    private readonly _room: string;

    constructor(config: {
        caller: (origin: string | null) => EditCaller<T> | null;
        getContext: () => Promise<T["context"]>;
        intervalMs: number;
        keepAlive: (promise: Promise<unknown>) => void;
        onEdits: (event: IOStorageEditsEvent<T>) => MaybePromise<void>;
        room: string;
    }) {
        this._caller = config.caller;
        this._getContext = config.getContext;
        this._interval = config.intervalMs;
        this._keepAlive = config.keepAlive;
        this._onEdits = config.onEdits;
        this._room = config.room;
    }

    public attach(doc: CrdtDocLike<any, any>): void {
        this.detach();
        this._closed = false;
        this._unsubscribe = doc.subscribe((notice) => {
            if (this._closed || !notice.update) return;

            const caller = this._caller(notice.origin ?? null);

            this._changes.push({
                update: notice.update,
                user: caller?.user ?? null,
                operator: caller?.operator ?? null,
                procedure: caller?.procedure ?? null,
            });
            this._arm();
        });
    }

    public detach(): void {
        this._closed = true;
        this._unsubscribe?.();
        this._unsubscribe = null;
        this._clearTimer();
    }

    /** Send the waiting list now, then one follow-up list if that call writes. */
    public flush(): Promise<void> {
        const run = this._queue.then(() => this._flush());

        this._queue = run.then(
            () => undefined,
            () => undefined,
        );

        return run;
    }

    public reopen(): void {
        this._closed = false;
        this._changes = [];
        this._clearTimer();
    }

    private _arm(): void {
        if (this._timer || this._closed) return;

        const pending = new Promise<void>((resolve) => {
            this._timerDone = resolve;
            this._timer = setTimeout(() => {
                this._timer = null;
                this._timerDone = null;
                void this.flush().finally(resolve);
            }, this._interval);
        });

        this._keepAlive(pending);
    }

    private _clearTimer(): void {
        if (!this._timer) return;

        clearTimeout(this._timer);
        this._timer = null;
        const done = this._timerDone;

        this._timerDone = null;
        done?.();
    }

    private async _emit(): Promise<void> {
        if (this._changes.length === 0) return;

        const changes = this._changes;

        this._changes = [];

        try {
            const context = await this._getContext();

            await this._onEdits({ changes, context, room: this._room });
        } catch (error) {
            console.error(error);
        }
    }

    private async _flush(): Promise<void> {
        this._clearTimer();
        await this._emit();
        this._clearTimer();

        if (this._changes.length > 0) await this._emit();
    }
}
