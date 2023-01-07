import { JsonObject } from "@pluv/types";

export abstract class AbstractPersistance {
    public abstract addUser(
        room: string,
        connectionId: string,
        user: JsonObject | null
    ): Promise<void>;

    public abstract deleteStorageState(room: string): Promise<void>;

    public abstract deleteUser(
        room: string,
        connectionId: string
    ): Promise<void>;

    public abstract deleteUsers(room: string): Promise<void>;

    public abstract getStorageState(room: string): Promise<string | null>;

    public abstract getUser(
        room: string,
        connectionId: string
    ): Promise<JsonObject | null>;

    public abstract getUsers(
        room: string
    ): Promise<readonly (JsonObject | null)[]>;

    public abstract setStorageState(room: string, state: string): Promise<void>;
}
