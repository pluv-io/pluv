interface SqlResult {
    one(): { count?: number; data?: string; room?: string };
    toArray(): { count?: number }[];
}

const emptyResult = (): SqlResult => ({
    one: () => {
        throw new Error("No rows");
    },
    toArray: () => [],
});

/**
 * Minimal Durable Object SQL/storage stand-in for `PersistenceCloudflareTransactionalStorage`.
 * Shared across `platform()` calls the way isolate hibernation reuses DO storage.
 */
export const createMockDurableObjectState = (): any => {
    const storage = new Map<string, string>();

    const exec = (query: string, ...binds: unknown[]): SqlResult => {
        if (query.includes("CREATE TABLE")) return emptyResult();

        if (query.includes("SELECT COUNT(*)")) {
            const room = String(binds[0]);

            return {
                one: () => ({ count: storage.has(room) ? 1 : 0 }),
                toArray: () => [{ count: storage.has(room) ? 1 : 0 }],
            };
        }

        if (query.includes("UPDATE") && query.includes("__pluv_storage")) {
            storage.set(String(binds[1]), String(binds[0]));
            return emptyResult();
        }

        if (query.includes("INSERT INTO __pluv_storage")) {
            storage.set(String(binds[0]), String(binds[1]));
            return emptyResult();
        }

        if (query.includes("SELECT room, data")) {
            const room = String(binds[0]);
            const data = storage.get(room);

            if (typeof data !== "string") return emptyResult();

            return {
                one: () => ({ room, data }),
                toArray: () => [{ count: 1 }],
            };
        }

        if (query.includes("DELETE FROM __pluv_storage")) {
            storage.delete(String(binds[0]));
            return emptyResult();
        }

        return emptyResult();
    };

    return {
        storage: {
            sql: { exec },
        },
        acceptWebSocket: () => undefined,
        getWebSockets: () => [],
        getWebSocketAutoResponseTimestamp: () => null,
        setWebSocketAutoResponse: () => undefined,
    };
};
