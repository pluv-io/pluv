import { AbstractPersistence } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { partitionByLength } from "./utils";

/**
 * !HACK
 * @description The max amount of keys a Cloudflare transactional storage may delete at once
 * @see https://developers.cloudflare.com/durable-objects/api/transactional-storage-api/#delete
 * @date July 8, 2024
 */
const CLOUDFLARE_DELETE_BATCH_LIMIT = 128;
const STORAGE_PREFIX = "$PLUV_STORAGE;";
const USER_PREFIX = "$PLUV_USER";

export interface PersistenceCloudflareTransactionalStorageConfig {
    state: DurableObjectState;
}

export class PersistenceCloudflareTransactionalStorage extends AbstractPersistence {
    private _state: DurableObjectState;

    constructor(config: PersistenceCloudflareTransactionalStorageConfig) {
        super();

        const { state } = config;

        this._state = state;
    }

    public async addUser(room: string, connectionId: string, user: JsonObject | null): Promise<void> {
        await this._state.storage.put(this._getUserKey(room, connectionId), user);
    }

    public async deleteStorageState(room: string): Promise<void> {
        await this._state.storage.delete(this._getStorageKey(room));
    }

    public async deleteUser(room: string, connectionId: string): Promise<void> {
        await this._state.storage.delete(this._getUserKey(room, connectionId));
    }

    public async deleteUsers(room: string): Promise<void> {
        const map = await this._state.storage.list({
            allowConcurrency: true,
            noCache: true,
            prefix: USER_PREFIX,
        });

        const partitions = partitionByLength(Array.from(map.keys()), CLOUDFLARE_DELETE_BATCH_LIMIT);

        await this._state.storage.transaction(async (tx) => {
            await partitions.reduce(async (promise, partition) => {
                return await promise.then(async () => {
                    await tx.delete(partition as string[]);
                });
            }, Promise.resolve());
        });
    }

    public async getStorageState(room: string): Promise<string | null> {
        const storage = await this._state.storage.get<string>(this._getStorageKey(room));

        return storage ?? null;
    }

    public async getUser(room: string, connectionId: string): Promise<JsonObject | null> {
        const user = await this._state.storage.get<JsonObject | null>(this._getUserKey(room, connectionId));

        return user ?? null;
    }

    public async getUsers(room: string): Promise<readonly (JsonObject | null)[]> {
        const storage = await this._state.storage.list({
            prefix: USER_PREFIX,
        });

        return Array.from(storage.values()) as (JsonObject | null)[];
    }

    public async getUsersSize(room: string): Promise<number> {
        const storage = await this._state.storage.list({ prefix: USER_PREFIX });

        return storage.size;
    }

    public async setStorageState(room: string, state: string): Promise<void> {
        await this._state.storage.put(this._getStorageKey(room), state, {
            allowConcurrency: true,
        });
    }

    private _getStorageKey(room: string): string {
        return `${STORAGE_PREFIX}::${room}`;
    }

    private _getUserKey(room: string, connectionId: string): string {
        return `${USER_PREFIX}::${room}::${connectionId}`;
    }
}
