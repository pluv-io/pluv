import { AbstractPersistence } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import type { Cluster, Redis } from "ioredis";

const DELIMITER = ":::";
const HASH_TAG = "{PluvPersistenceRedis}";

export type RedisClient = Cluster | Redis;

export interface PersistenceRedisOptions {
    client: RedisClient;
}

export class PersistenceRedis extends AbstractPersistence {
    private _client: RedisClient;

    constructor(options: PersistenceRedisOptions) {
        super();

        const { client } = options;

        this._client = client;
    }

    public async addUser(room: string, connectionId: string, user: JsonObject | null): Promise<void> {
        await this._client
            .multi()
            .sadd(this._getRoomUsersKey(room), connectionId)
            .set(this._getRoomUsersUserKey(room, connectionId), JSON.stringify(user))
            .exec();
    }

    public async deleteStorageState(room: string): Promise<void> {
        await this._client.del(this._getRoomStorageKey(room));
    }

    public async deleteUser(room: string, connectionId: string): Promise<void> {
        const size = await this.getSize(room);

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

    public async getSize(room: string): Promise<number> {
        return await this._client.scard(this._getRoomUsersKey(room));
    }

    public async getStorageState(room: string): Promise<string | null> {
        return await this._client.get(this._getRoomStorageKey(room));
    }

    public async setStorageState(room: string, state: string): Promise<void> {
        await this._client.set(this._getRoomStorageKey(room), state);
    }

    public async getUser(room: string, connectionId: string): Promise<JsonObject | null> {
        const data = await this._client.get(this._getRoomUsersUserKey(room, connectionId));

        return !data ? null : JSON.parse(data);
    }

    public async getUsers(room: string): Promise<readonly (JsonObject | null)[]> {
        const members = await this._client.smembers(this._getRoomUsersKey(room));

        return await Promise.all(members.map((connectionId) => this.getUser(room, connectionId)));
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
