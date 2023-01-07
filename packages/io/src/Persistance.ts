import type { JsonObject } from "@pluv/types";
import { AbstractPersistance } from "./AbstractPersistance";

export class Persistance extends AbstractPersistance {
    private _storages = new Map<string, string>();
    private _users = new Map<string, Map<string, JsonObject | null>>();

    public addUser(
        room: string,
        connectionId: string,
        user: JsonObject | null
    ): Promise<void> {
        const users =
            this._users.get(room) ?? new Map<string, JsonObject | null>();

        this._users.set(room, users);
        users.set(connectionId, user);

        return Promise.resolve();
    }

    public deleteStorageState(room: string): Promise<void> {
        this._storages.delete(room);

        return Promise.resolve();
    }

    public async deleteUser(room: string, connectionId: string): Promise<void> {
        const users = this._users.get(room);

        if (!users) return;

        users.delete(connectionId);

        if (!users.size) {
            await this.deleteUsers(room);
            await this.deleteStorageState(room);
        }

        return Promise.resolve();
    }

    public deleteUsers(room: string): Promise<void> {
        this._users.delete(room);

        return Promise.resolve();
    }

    public getStorageState(room: string): Promise<string | null> {
        const storage = this._storages.get(room) ?? null;

        return Promise.resolve(storage);
    }

    public getUser(
        room: string,
        connectionId: string
    ): Promise<JsonObject | null> {
        const user = this._users.get(room)?.get(connectionId);

        return Promise.resolve(user ?? null);
    }

    public getUsers(room: string): Promise<readonly (JsonObject | null)[]> {
        const users = this._users.get(room);

        if (!users) return Promise.resolve([]);

        return Promise.resolve(Array.from(users.values()));
    }

    public setStorageState(room: string, state: string): Promise<void> {
        this._storages.set(room, state);

        return Promise.resolve();
    }
}
