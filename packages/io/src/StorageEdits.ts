import type { CrdtDocLike, MaybePromise } from "@pluv/types";
import { StorageChangeLog } from "./StorageChangeLog";
import { StorageReservations } from "./StorageReservations";
import type { IODefs } from "./IODefs";
import type { IOStorageEdit, IOStorageEditsEvent } from "./types";

/**
 * Reservations become edits once the document covers them. A write that was
 * never reserved is still reported, with no author, so a replay includes it.
 */
export class StorageEdits<T extends IODefs = IODefs> {
    private _paused = false;
    private _unsubscribe: (() => void) | null = null;

    private readonly _log: StorageChangeLog<T>;
    private readonly _reservations: StorageReservations<T>;

    constructor(config: {
        getContext: () => Promise<T["context"]>;
        intervalMs: number;
        keepAlive: (promise: Promise<unknown>) => void;
        /** Waiting updates are dropped past this many bytes. `0` keeps them all. */
        maxBytes?: number;
        onEdits: (event: IOStorageEditsEvent<T>) => MaybePromise<void>;
        room: string;
    }) {
        this._log = new StorageChangeLog(config);
        this._reservations = new StorageReservations(config.maxBytes ?? 0);
    }

    public attach(doc: CrdtDocLike<any, any>): void {
        this.detach();
        this._log.reopen();
        this._paused = false;
        this._unsubscribe = doc.subscribe((notice) => {
            if (this._paused || !notice.update) return;

            this.note(doc, notice.update);
        });
    }

    public clearReservations(): void {
        this._reservations.clear();
    }

    public detach(): void {
        this._reservations.clear();
        this._unsubscribe?.();
        this._unsubscribe = null;
        this._log.detach();
    }

    public flush(): Promise<void> {
        return this._log.flush();
    }

    public note(doc: CrdtDocLike<any, any>, notice?: string): void {
        const version = new Map(doc.readStateVersion(doc.getStateVector()));
        const admitted = this._reservations.takeCovered(version, (update) =>
            doc.containsUpdate(update),
        );
        const edits: IOStorageEdit<T>[] = [...admitted];

        // A pending update is still a reservation. A notice already in the document,
        // and not reserved, is an edit with no author. Skip that notice when a
        // reservation was just admitted. A separate write in this same note is
        // dropped with it. The reserved paths call `note` with no notice.
        if (
            notice &&
            admitted.length === 0 &&
            !this._reservations.holds(notice) &&
            doc.containsUpdate(notice)
        ) {
            edits.push({ update: notice, user: null, operator: null, procedure: null });
        }

        this._reservations.trim();
        this._log.push(edits);
    }

    /** Skip subscription notes while a capture is still collecting its bytes. */
    public pause(paused: boolean): void {
        this._paused = paused;
    }

    public reopen(): void {
        this._reservations.clear();
        this._log.reopen();
    }

    public reserve(
        doc: CrdtDocLike<any, any>,
        input: {
            operator: IOStorageEdit<T>["operator"];
            procedure: string | null;
            update: string;
            user: IOStorageEdit<T>["user"];
        },
    ): void {
        if (!input.update) return;

        this._reservations.add({
            ...input,
            version: doc.readUpdateVersion(input.update),
        });
    }
}
