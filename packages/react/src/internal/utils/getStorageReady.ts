import type { SubscribeFn, WebSocketConnection } from "@pluv/types";
import { ConnectionState } from "@pluv/types";

type StorageReadyRoom = {
    getConnection: () => WebSocketConnection;
    getStorageLoaded: () => boolean;
    subscribe: {
        connection: SubscribeFn<{ connection: WebSocketConnection }>;
    };
};

const cache = new WeakMap<object, Promise<void>>();

const isFailedConnection = (state: ConnectionState): boolean => {
    return state === ConnectionState.Closed || state === ConnectionState.Unavailable;
};

export const getStorageReady = (room: StorageReadyRoom): Promise<void> => {
    if (room.getStorageLoaded()) return Promise.resolve();

    const cached = cache.get(room);

    if (cached) return cached;

    let settled = false;
    let unsubscribe: (() => void) | null = null;

    const promise = new Promise<void>((resolve, reject) => {
        const settle = (outcome: () => void): void => {
            if (settled) return;

            settled = true;
            unsubscribe?.();
            cache.delete(room);
            outcome();
        };

        const check = (connectionState: ConnectionState): void => {
            if (room.getStorageLoaded()) {
                settle(resolve);
                return;
            }

            if (isFailedConnection(connectionState)) {
                settle(() => {
                    reject(
                        new Error(
                            "Room closed or storage became unavailable before storage loaded",
                        ),
                    );
                });
            }
        };

        unsubscribe = room.subscribe.connection((state) => {
            check(state.connection.state);
        });

        check(room.getConnection().state);
    });

    if (!settled) cache.set(room, promise);

    return promise;
};
