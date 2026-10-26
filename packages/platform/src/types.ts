import type { RoomEffects } from "@pluv/io";
import type { JsonObject } from "@pluv/types";

export type PluvSocket = {
    id: string;
    lastPing: number | null;
};

export type PluvRoomState = {
    storage?: {
        sql?: {
            exec: (...args: unknown[]) => unknown;
        };
    };
    waitUntil?: (promise: Promise<unknown>) => void;
};

export type PluvRoomContext = {
    env?: Record<string, unknown>;
    sessions?: PluvSocket[];
    state?: PluvRoomState;
};

export type PlainError = { message: string } | null;

/** Supervisor method the facet calls when a slow procedure produces frames. */
export type FrameDelivery = {
    deliverFrames(effects: RoomEffects): void | Promise<void>;
    /** Starts the snapshot loop when `storageDirty` is set. */
    noteStorageDirty(): void | Promise<void>;
    /** Sends procedure frames after `deliverFrames` failed. */
    retryUnsent(effects: RoomEffects): void | Promise<void>;
};

/** Frame delivery for a prepared storage write. `finish` settles the host call. */
export type StorageFrameDelivery = FrameDelivery & {
    finish(error: PlainError): void | Promise<void>;
};

/** Supervisor method the facet calls when a slow presence patch resolves. */
export type PresenceDelivery = {
    deliverPresence(delivery: {
        error: PlainError;
        name: string;
        patch: JsonObject | null;
        senderId: string;
    }): void | Promise<void>;
};
