import { AbstractPersistence } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { castNumber, partitionByLength, sql } from "./utils";

/**
 * !HACK
 * @description The max amount of keys a Cloudflare transactional storage may delete at once
 * @see https://developers.cloudflare.com/durable-objects/api/transactional-storage-api/#delete
 * @date July 8, 2024
 */
const KV_CLOUDFLARE_DELETE_BATCH_LIMIT = 128;
const KV_STORAGE_PREFIX = "$PLUV_STORAGE;";
const KV_USER_PREFIX = "$PLUV_USER";

const SQLITE_STORAGE_TABLE = "__pluv_storage";
const SQLITE_USER_TABLE = "__pluv_user";

export interface PersistenceCloudflareTransactionalStorageConfig {
    mode: "kv" | "sqlite";
}
export class PersistenceCloudflareTransactionalStorage extends AbstractPersistence {
    private _mode: "kv" | "sqlite";
    private _state: DurableObjectState | null = null;
    private _initialized: Promise<true> | null = null;

    constructor(config: PersistenceCloudflareTransactionalStorageConfig) {
        super();

        const { mode } = config;

        this._mode = mode;
    }

    public async addUser(
        room: string,
        connectionId: string,
        user: JsonObject | null,
    ): Promise<void> {
        if (!this._initialized) return;
        if (!this._state) return;

        await this._initialized;

        if (this._mode === "kv") {
            await this._state.storage.put(this._getUserKey(room, connectionId), user);
            return;
        }

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

        if (this._mode === "kv") {
            await this._state.storage.delete(this._getStorageKey(room));
            return;
        }

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

        if (this._mode === "kv") {
            await this._state.storage.delete(this._getUserKey(room, connectionId));

            return;
        }

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

        if (this._mode === "kv") {
            const map = await this._state.storage.list({
                allowConcurrency: true,
                noCache: true,
                prefix: `${KV_USER_PREFIX}::${room}`,
            });

            const partitions = partitionByLength(
                Array.from(map.keys()),
                KV_CLOUDFLARE_DELETE_BATCH_LIMIT,
            );

            await this._state.storage.transaction(async (tx) => {
                await partitions.reduce(async (promise, partition) => {
                    await promise;
                    await tx.delete(partition as string[]);
                }, Promise.resolve());
            });

            return;
        }

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

        if (this._mode === "kv") {
            const storage = await this._state.storage.get<string>(this._getStorageKey(room));
            return storage ?? null;
        }

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

        if (this._mode === "kv") {
            const user = await this._state.storage.get<JsonObject | null>(
                this._getUserKey(room, connectionId),
            );

            return user ?? null;
        }

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

        if (this._mode === "kv") {
            const entries = await this._state.storage
                .list<JsonObject | null>({
                    prefix: `${KV_USER_PREFIX}::${room}`,
                })
                .then((map) => Array.from(map.entries()));

            return entries.reduce((map, [key, user]) => {
                const connectionId = key.split("::").slice(-1)[0];

                return !!connectionId ? map.set(connectionId, user) : map;
            }, new Map<string, JsonObject | null>());
        }

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

        if (this._mode) {
            const storage = await this._state.storage.list({
                prefix: `${KV_USER_PREFIX}::${room}`,
            });

            return storage.size;
        }

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

    public initialize(roomContext: { state: DurableObjectState }): this {
        this._initialized = (async () => {
            const { state } = roomContext;

            this._state = state;

            if (this._mode === "sqlite") {
                this._state.storage.sql.exec(sql`
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
            }

            return true as const;
        })();

        return this;
    }

    public async setStorageState(room: string, state: string): Promise<void> {
        if (!this._initialized) return;
        if (!this._state) return;

        await this._initialized;

        if (this._mode === "kv") {
            await this._state.storage.put(this._getStorageKey(room), state, {
                allowConcurrency: true,
            });
            return;
        }

        this._state.storage.sql.exec(
            sql`
                INSERT INTO ${SQLITE_STORAGE_TABLE} VALUES (?, ?);
            `,
            room,
            state,
        );
    }

    private _getStorageKey(room: string): string {
        if (this._mode === "sqlite") {
            throw new Error("Attempted to get kv key for sqlite storage");
        }

        return `${KV_STORAGE_PREFIX}::${room}`;
    }

    private _getUserKey(room: string, connectionId: string): string {
        if (this._mode === "sqlite") {
            throw new Error("Attempted to get kv key for sqlite storage");
        }

        return `${KV_USER_PREFIX}::${room}::${connectionId}`;
    }
}
