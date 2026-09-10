import { AbstractPersistence } from "@pluv/io";
import type { JsonObject } from "@pluv/types";

export class TestPersistence extends AbstractPersistence {
    private readonly _storage = new Map<string, string>();
    private readonly _users = new Map<string, Map<string, JsonObject | null>>();

    public addUser(room: string, connectionId: string, user: JsonObject | null): Promise<void> {
        const users = this._users.get(room) ?? new Map();

        users.set(connectionId, user);
        this._users.set(room, users);

        return Promise.resolve();
    }

    public deleteStorageState(room: string): Promise<void> {
        this._storage.delete(room);

        return Promise.resolve();
    }

    public deleteUser(room: string, connectionId: string): Promise<void> {
        this._users.get(room)?.delete(connectionId);

        return Promise.resolve();
    }

    public deleteUsers(room: string): Promise<void> {
        this._users.delete(room);

        return Promise.resolve();
    }

    public getStorageState(room: string): Promise<string | null> {
        return Promise.resolve(this._storage.get(room) ?? null);
    }

    public getUser(room: string, connectionId: string): Promise<JsonObject | null> {
        return Promise.resolve(this._users.get(room)?.get(connectionId) ?? null);
    }

    public getUsers(room: string): Promise<Map<string, JsonObject | null>> {
        return Promise.resolve(this._users.get(room) ?? new Map());
    }

    public getUsersSize(room: string): Promise<number> {
        return Promise.resolve(this._users.get(room)?.size ?? 0);
    }

    public initialize(): this {
        return this;
    }

    public setStorageState(room: string, state: string): Promise<void> {
        this._storage.set(room, state);

        return Promise.resolve();
    }
}
