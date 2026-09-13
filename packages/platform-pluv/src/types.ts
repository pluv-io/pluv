import type {
    GetInitialStorageFn,
    IORoomDestroyedEvent,
    IORoomListenerEvent,
    IOUserConnectedEvent,
    IOUserDisconnectedEvent,
} from "@pluv/io";
import type { z } from "zod";
import type {
    ZodEventKind,
    ZodEventResponse,
    ZodInitialStorageResponse,
    ZodRoomDestroyedResponse,
    ZodStorageDestroyedResponse,
    ZodUserConnectedResponse,
    ZodUserDisconnectedResponse,
} from "./schemas";

export type PluvIOFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface PluvIOEndpoints {
    createToken: string;
    fetch?: PluvIOFetch;
}

export type PluvIOListeners = {
    getInitialStorage?: GetInitialStorageFn<Record<string, any>>;
    onRoomDestroyed: (event: IORoomDestroyedEvent) => void;
    onStorageDestroyed: (event: IORoomListenerEvent) => void;
    onUserConnected: (event: IOUserConnectedEvent) => void;
    onUserDisconnected: (event: IOUserDisconnectedEvent) => void;
};

export type EventKind = z.output<typeof ZodEventKind>;

export type InitialStorageResponse = z.output<typeof ZodInitialStorageResponse>;
export type RoomDestroyedResponse = z.output<typeof ZodRoomDestroyedResponse>;
export type StorageDestroyedResponse = z.output<typeof ZodStorageDestroyedResponse>;
export type UserConnectedResponse = z.output<typeof ZodUserConnectedResponse>;
export type UserDisconnectedResponse = z.output<typeof ZodUserDisconnectedResponse>;

export type EventResponse = z.output<typeof ZodEventResponse>;
