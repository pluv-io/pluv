import { AbstractStorageStore } from "@pluv/client";
import type { IDBPDatabase } from "idb";
import { openDB } from "idb";

const STORAGE_STORE_FLATTEN_THRESHOLD = 500;
const UPGRADES_KEY = "__PLUV_UPDATES";

type IndexDBSchema = {
    [UPGRADES_KEY]: {
        key: number;
        value: string;
    };
};

type IndexedDB = IDBPDatabase<IndexDBSchema>;

export class IndexedDBStorage extends AbstractStorageStore {
    public room: string;

    private _db: IndexedDB | null = null;
    private _dbRef: number = 0;
    private _dbSize: number = 0;

    constructor(room: string) {
        super(room);

        this.room = room;
    }

    public async addUpdate(update: string): Promise<void> {
        const db = this._db;

        if (!db) return;

        await db.add(UPGRADES_KEY, update);

        this._dbSize += 1;
    }

    public destroy(): Promise<void> {
        if (!this._db) return Promise.resolve();

        this._db.close();
        this._db = null;
        this._dbRef = 0;
        this._dbSize = 0;

        return Promise.resolve();
    }

    public async flatten(encodedState: string): Promise<void> {
        const db = this._db;

        if (!db) return;

        await db.add(UPGRADES_KEY, encodedState);
        await db.delete(UPGRADES_KEY, this._getUpperBound(this._dbRef, true));

        this._dbSize = await this._getSize();
    }

    public async getShouldFlatten(): Promise<boolean> {
        const dbSize = await this._getSize();

        return dbSize >= STORAGE_STORE_FLATTEN_THRESHOLD;
    }

    public async getUpdates(start: number = 0): Promise<readonly string[]> {
        const db = this._db;

        if (!db) return [];

        const updates = await db.getAll(
            UPGRADES_KEY,
            this._getLowerBound(start),
        );

        const lastKey = await this._getLastKey();

        this._dbRef = lastKey + 1;

        return updates;
    }

    public async initialize(): Promise<void> {
        const newDB = await openDB<IndexDBSchema>(this.room, undefined, {
            upgrade: (db) => {
                db.createObjectStore(UPGRADES_KEY, { autoIncrement: true });
            },
        });

        newDB.addEventListener("versionchange", () => {
            newDB.close();
        });

        if (typeof window !== "undefined") {
            window.addEventListener("unload", () => {
                newDB.close();
            });
        }

        this._db = newDB;
    }

    private async _getLastKey(): Promise<number> {
        const db = this._db;

        if (!db) throw new Error("IndexedDB not initialized");

        const store = db.transaction(UPGRADES_KEY).objectStore(UPGRADES_KEY);
        const cursor = await store.openCursor(null, "prev");

        return cursor?.key ?? -1;
    }

    private _getLowerBound(lower: number, open: boolean = false): IDBKeyRange {
        return IDBKeyRange.lowerBound(lower, open);
    }

    private async _getSize(): Promise<number> {
        if (this._dbSize) return this._dbSize;

        const db = this._db;

        if (!db) throw new Error("IndexedDB not initialized");

        const store = db.transaction(UPGRADES_KEY).objectStore(UPGRADES_KEY);

        return store.count();
    }

    private _getUpperBound(upper: number, open: boolean = false): IDBKeyRange {
        return IDBKeyRange.upperBound(upper, open);
    }
}
