import type { JsonObject } from "@pluv/types";
import { AbstractPersistence } from "./AbstractPersistence";

export class Persistence extends AbstractPersistence {
    private _storages = new Map<string, string>();
    private _users = new Map<string, Map<string, JsonObject | null>>();

    public addUser(room: string, connectionId: string, user: JsonObject | null): Promise<void> {
        const users = this._users.get(room) ?? new Map<string, JsonObject | null>();

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

    public getSize(room: string): Promise<number> {
        return Promise.resolve(this._users.get(room)?.size ?? 0);
    }

    public getStorageState(room: string): Promise<string | null> {
        const storage = this._storages.get(room) ?? null;

        return Promise.resolve(storage);
    }

    public getUser(room: string, connectionId: string): Promise<JsonObject | null> {
        const user = this._users.get(room)?.get(connectionId);

        return Promise.resolve(user ?? null);
    }

    public async getUsers(room: string): Promise<Map<string, JsonObject | null>> {
        const users = this._users.get(room);

        if (!users) return new Map();

        return users;
    }

    public async getUsersSize(room: string): Promise<number> {
        return this._users.size;
    }

    public initialize(roomContext: any): this {
        return this;
    }

    public setStorageState(room: string, state: string): Promise<void> {
        this._storages.set(room, state);

        return Promise.resolve();
    }
}
