import type { MaybePromise } from "@pluv/types";
import { ArmedWait } from "./utils";
import type { IODefs } from "./IODefs";
import type { IOStorageEdit, IOStorageEditsEvent } from "./types";

/**
 * Ordered document edits for `onStorageEdits`. The first edit starts the wait.
 * Edits during that wait join the same list. A room with no listener does not
 * construct this.
 */
export class StorageChangeLog<T extends IODefs = IODefs> {
    private _changes: IOStorageEdit<T>[] = [];
    private _closed = false;
    private _queue: Promise<void> = Promise.resolve();

    private readonly _getContext: () => Promise<T["context"]>;
    private readonly _onEdits: (event: IOStorageEditsEvent<T>) => MaybePromise<void>;
    private readonly _room: string;
    private readonly _wait: ArmedWait;

    constructor(config: {
        getContext: () => Promise<T["context"]>;
        intervalMs: number;
        keepAlive: (promise: Promise<unknown>) => void;
        onEdits: (event: IOStorageEditsEvent<T>) => MaybePromise<void>;
        room: string;
    }) {
        this._getContext = config.getContext;
        this._onEdits = config.onEdits;
        this._room = config.room;
        this._wait = new ArmedWait(config.intervalMs, config.keepAlive);
    }

    public push(changes: readonly IOStorageEdit<T>[]): void {
        if (this._closed || changes.length === 0) return;

        this._changes.push(...changes);
        this._arm();
    }

    public detach(): void {
        this._closed = true;
        this._wait.clear();
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
        this._wait.clear();
    }

    private _arm(): void {
        if (this._closed) return;

        this._wait.arm(() => this.flush());
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
        this._wait.clear();
        await this._emit();
        this._wait.clear();

        if (this._changes.length > 0) await this._emit();
    }
}
