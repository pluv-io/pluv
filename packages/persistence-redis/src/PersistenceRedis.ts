import { AbstractPersistence } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import type { Cluster, Redis } from "ioredis";
import { partitionByLength } from "./utils";

const DELIMITER = ":::";
const HASH_TAG = "{PluvPersistenceRedis}";

const GET_USERS_CONCURRENCY = 4;

export type RedisClient = Cluster | Redis;

export interface PersistenceRedisOptions {
    client: RedisClient;
}

export class PersistenceRedis extends AbstractPersistence {
    private _client: RedisClient;
    private _initialized: Promise<true> | null = null;

    constructor(options: PersistenceRedisOptions) {
        super();

        const { client } = options;

        this._client = client;
    }

    public async addUser(
        room: string,
        connectionId: string,
        user: JsonObject | null,
    ): Promise<void> {
        if (!this._initialized) return;

        await this._initialized;

        await this._client
            .multi()
            .sadd(this._getRoomUsersKey(room), connectionId)
            .set(this._getRoomUsersUserKey(room, connectionId), JSON.stringify(user))
            .exec();
    }

    public async deleteStorageState(room: string): Promise<void> {
        if (!this._initialized) return;

        await this._initialized;

        await this._client.del(this._getRoomStorageKey(room));
    }

    public async deleteUser(room: string, connectionId: string): Promise<void> {
        if (!this._initialized) return;

        await this._initialized;

        const size = await this.getUsersSize(room);

        let multi = this._client
            .multi()
            .srem(this._getRoomUsersKey(room), connectionId)
            .del(this._getRoomUsersUserKey(room, connectionId));

        if (size === 1) {
            multi = multi.del(this._getRoomStorageKey(room)).del(this._getRoomUsersKey(room));
        }

        await multi.exec();
    }

    public async deleteUsers(room: string): Promise<void> {
        if (!this._initialized) return;

        await this._initialized;

        const members = await this._client.smembers(this._getRoomUsersKey(room));

        await members
            .reduce(
                (commands, connectionId) => {
                    return commands.del(this._getRoomUsersUserKey(room, connectionId));
                },
                this._client.multi().del(this._getRoomUsersKey(room)),
            )
            .exec();
    }

    public async getStorageState(room: string): Promise<string | null> {
        if (!this._initialized) return null;

        await this._initialized;

        return await this._client.get(this._getRoomStorageKey(room));
    }

    public async setStorageState(room: string, state: string): Promise<void> {
        if (!this._initialized) return;

        await this._initialized;

        await this._client.set(this._getRoomStorageKey(room), state);
    }

    public async getUser(room: string, connectionId: string): Promise<JsonObject | null> {
        if (!this._initialized) return null;

        await this._initialized;

        const data = await this._client.get(this._getRoomUsersUserKey(room, connectionId));

        return !data ? null : JSON.parse(data);
    }

    public async getUsers(
        room: string,
    ): Promise<Map<[connectionId: string][0], JsonObject | null>> {
        if (!this._initialized) return new Map();

        await this._initialized;

        const members = await this._client.smembers(this._getRoomUsersKey(room));
        const partitions = partitionByLength(members, GET_USERS_CONCURRENCY);

        return await partitions.reduce(async (promise, partition) => {
            const map = await promise;

            const promises = partition.map(async (connectionId) => {
                map.set(connectionId, await this.getUser(room, connectionId));
            });

            await Promise.all(promises);

            return map;
        }, Promise.resolve(new Map<string, JsonObject | null>()));
    }

    public async getUsersSize(room: string): Promise<number> {
        if (!this._initialized) return 0;

        await this._initialized;

        return await this._client.scard(this._getRoomUsersKey(room));
    }

    public initialize(roomContext: {}): this {
        this._initialized = Promise.resolve(true as const);

        return this;
    }

    private _getClusterKey(key: string): string {
        return `${HASH_TAG}${key}`;
    }

    private _getRoomStorageKey(room: string): string {
        return this._getClusterKey(`room_storage${DELIMITER}${room}`);
    }

    private _getRoomUsersKey(room: string): string {
        return this._getClusterKey(`room_users${DELIMITER}${room}`);
    }

    private _getRoomUsersUserKey(room: string, connectionId: string): string {
        return this._getClusterKey(`${this._getRoomUsersKey(room)}${DELIMITER}${connectionId}`);
    }
}
