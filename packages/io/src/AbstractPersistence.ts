import type { JsonObject } from "@pluv/types";

export abstract class AbstractPersistence {
    public abstract addUser(
        room: string,
        connectionId: string,
        user: JsonObject | null,
    ): Promise<void>;

    public abstract deleteStorageState(room: string): Promise<void>;

    public abstract deleteUser(room: string, connectionId: string): Promise<void>;

    public abstract deleteUsers(room: string): Promise<void>;

    public abstract getStorageState(room: string): Promise<string | null>;

    public abstract getUser(room: string, connectionId: string): Promise<JsonObject | null>;

    public abstract getUsers(
        room: string,
    ): Promise<Map<[connectionId: string][0], JsonObject | null>>;

    public abstract getUsersSize(room: string): Promise<number>;

    public abstract initialize(roomContext: any): AbstractPersistence;

    public abstract setStorageState(room: string, state: string): Promise<void>;
}
