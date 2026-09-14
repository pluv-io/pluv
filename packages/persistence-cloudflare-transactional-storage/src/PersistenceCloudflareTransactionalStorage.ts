import { AbstractPersistence } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { castNumber, sql } from "./utils";

const SQLITE_STORAGE_TABLE = "__pluv_storage";
const SQLITE_USER_TABLE = "__pluv_user";

type PersistenceCloudflareTransactionalStorageInit = {
    _initialized?: Promise<true> | null;
    _state?: DurableObjectState | null;
};

export class PersistenceCloudflareTransactionalStorage extends AbstractPersistence {
    private _state: DurableObjectState | null = null;
    private _initialized: Promise<true> | null = null;

    constructor(config: PersistenceCloudflareTransactionalStorageInit = {}) {
        super();

        this._initialized = config._initialized ?? null;
        this._state = config._state ?? null;
    }

    public async addUser(
        room: string,
        connectionId: string,
        user: JsonObject | null,
    ): Promise<void> {
        if (!this._initialized) return;
        if (!this._state) return;

        await this._initialized;

        const result = this._state.storage.sql.exec<{ id: string }>(
            sql`
                SELECT id
                FROM ${SQLITE_USER_TABLE}
                WHERE id = ?;
            `,
            connectionId,
        );

        const existing = !!result.toArray()[0];

        if (existing) return;

        this._state.storage.sql.exec(
            sql`
                INSERT INTO ${SQLITE_USER_TABLE} VALUES (?, ?, ?);
            `,
            connectionId,
            JSON.stringify(user),
            room,
        );
    }

    public async deleteStorageState(room: string): Promise<void> {
        if (!this._initialized) return;
        if (!this._state) return;

        await this._initialized;

        this._state.storage.sql.exec(
            sql`
                DELETE FROM ${SQLITE_STORAGE_TABLE}
                WHERE room = ?;
            `,
            room,
        );
    }

    public async deleteUser(room: string, connectionId: string): Promise<void> {
        if (!this._initialized) return;
        if (!this._state) return;

        await this._initialized;

        this._state.storage.sql.exec(
            sql`
                DELETE FROM ${SQLITE_USER_TABLE}
                WHERE room = ?
                AND id = ?;
            `,
            room,
            connectionId,
        );
    }

    public async deleteUsers(room: string): Promise<void> {
        if (!this._initialized) return;
        if (!this._state) return;

        await this._initialized;

        this._state.storage.sql.exec(
            sql`
                DELETE FROM ${SQLITE_USER_TABLE}
                WHERE room = ?;
            `,
            room,
        );
    }

    public async getStorageState(room: string): Promise<string | null> {
        if (!this._initialized) return null;
        if (!this._state) return null;

        await this._initialized;

        const cursor = this._state.storage.sql.exec<{ room: string; data: string }>(
            sql`
                SELECT room, data
                FROM ${SQLITE_STORAGE_TABLE}
                WHERE room = ?;
            `,
            room,
        );

        try {
            const result = cursor.one();

            return result.data;
        } catch {
            return null;
        }
    }

    public async getUser(room: string, connectionId: string): Promise<JsonObject | null> {
        if (!this._initialized) return null;
        if (!this._state) return null;

        await this._initialized;

        const cursor = this._state.storage.sql.exec<{ id: string; data: string; room: string }>(
            sql`
                SELECT id, data, room
                FROM ${SQLITE_USER_TABLE}
                WHERE room = ?
                AND id = ?;
            `,
            room,
            connectionId,
        );

        try {
            const result = cursor.one();
            const user = JSON.parse(result.data);

            return user;
        } catch {
            return null;
        }
    }

    public async getUsers(
        room: string,
    ): Promise<Map<[connectionId: string][0], JsonObject | null>> {
        if (!this._initialized) return new Map();
        if (!this._state) return new Map();

        await this._initialized;

        const cursor = this._state.storage.sql.exec<{ id: string; data: string; room: string }>(
            sql`
                SELECT id, room, data
                FROM ${SQLITE_USER_TABLE}
                WHERE room = ?;
            `,
            room,
        );

        return cursor.toArray().reduce((map, { id, data }) => {
            try {
                const user = JSON.parse(data) as JsonObject;

                return map.set(id, user);
            } catch {
                return map;
            }
        }, new Map<string, JsonObject | null>());
    }

    public async getUsersSize(room: string): Promise<number> {
        if (!this._initialized) return 0;
        if (!this._state) return 0;

        await this._initialized;

        const cursor = this._state.storage.sql.exec<{ count: number }>(
            sql`
                SELECT COUNT(*) count
                FROM ${SQLITE_USER_TABLE}
                WHERE room = ?;
            `,
            room,
        );

        try {
            const result = cursor.one();

            return castNumber(result.count);
        } catch {
            return 0;
        }
    }

    public initialize(roomContext: { state: DurableObjectState }): typeof this {
        const { state } = roomContext;

        const initialized = (async () => {
            state.storage.sql.exec(sql`
                CREATE TABLE IF NOT EXISTS ${SQLITE_STORAGE_TABLE}(
                    room TEXT PRIMARY KEY,
                    data TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS ${SQLITE_USER_TABLE}(
                    id   TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    room TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ${SQLITE_USER_TABLE}_room ON ${SQLITE_USER_TABLE}(room);
            `);

            return true as const;
        })();

        return new PersistenceCloudflareTransactionalStorage({
            _initialized: initialized,
            _state: state,
        }) as typeof this;
    }

    public async setStorageState(room: string, state: string): Promise<void> {
        if (!this._initialized) return;
        if (!this._state) return;

        await this._initialized;

        this._state.storage.sql.exec(
            sql`
                INSERT INTO ${SQLITE_STORAGE_TABLE}(room, data) VALUES (?, ?)
                ON CONFLICT(room) DO UPDATE SET data = excluded.data;
            `,
            room,
            state,
        );
    }
}
