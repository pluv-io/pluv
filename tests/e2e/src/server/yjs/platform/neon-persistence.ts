import { AbstractPersistence } from "@pluv/io";
import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import type { JsonObject } from "@pluv/types";
import { isPlatformDatabaseRoom, readDatabaseUrl } from "../../../db/neon";

/**
 * Keeps session rows in the facet's SQLite. Rooms under `platform-db-` do not
 * keep the document there, so the user server loads it from Neon.
 */
export class NeonRoomPersistence extends AbstractPersistence {
    #sqlite: PersistenceCloudflareTransactionalStorage | null = null;
    #url: string | null = null;

    public initialize(roomContext: any): this {
        const sqlite = new PersistenceCloudflareTransactionalStorage().initialize(roomContext);
        const next = new NeonRoomPersistence();

        next.#sqlite = sqlite;
        next.#url = readDatabaseUrl(roomContext?.env);

        return next as this;
    }

    public addUser(room: string, connectionId: string, user: JsonObject | null): Promise<void> {
        return this.#users().addUser(room, connectionId, user);
    }

    public deleteStorageState(room: string): Promise<void> {
        if (this.#usesNeon(room)) return Promise.resolve();

        return this.#users().deleteStorageState(room);
    }

    public deleteUser(room: string, connectionId: string): Promise<void> {
        return this.#users().deleteUser(room, connectionId);
    }

    public deleteUsers(room: string): Promise<void> {
        return this.#users().deleteUsers(room);
    }

    public getStorageState(room: string): Promise<string | null> {
        if (this.#usesNeon(room)) return Promise.resolve(null);

        return this.#users().getStorageState(room);
    }

    public getUser(room: string, connectionId: string): Promise<JsonObject | null> {
        return this.#users().getUser(room, connectionId);
    }

    public getUsers(room: string): Promise<Map<string, JsonObject | null>> {
        return this.#users().getUsers(room);
    }

    public getUsersSize(room: string): Promise<number> {
        return this.#users().getUsersSize(room);
    }

    public setStorageState(room: string, state: string): Promise<void> {
        if (this.#usesNeon(room)) return Promise.resolve();

        return this.#users().setStorageState(room, state);
    }

    #users(): PersistenceCloudflareTransactionalStorage {
        const sqlite = this.#sqlite;

        if (!sqlite) throw new Error("Neon room persistence is not initialized.");

        return sqlite;
    }

    #usesNeon(room: string): boolean {
        return !!this.#url && isPlatformDatabaseRoom(room);
    }
}
