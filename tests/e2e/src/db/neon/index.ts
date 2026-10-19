import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export { rooms } from "./schema";

/** Rooms with this prefix save and load their document from Neon. */
export const PLATFORM_DB_ROOM_PREFIX = "platform-db-";

export const isPlatformDatabaseRoom = (room: string): boolean => {
    return room.startsWith(PLATFORM_DB_ROOM_PREFIX);
};

export const readDatabaseUrl = (env: Record<string, unknown> | undefined): string | null => {
    const url = env?.E2E_TEST_DATABASE_URL;

    if (typeof url !== "string" || url.length === 0) return null;

    return url;
};

/** HTTP driver. The hosted user worker reaches Neon with `fetch`. */
export const createNeonDb = (url: string) => {
    return drizzle(url, { schema });
};
