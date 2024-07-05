import type { PluvRoom, PluvRoomAddon } from "@pluv/client";
import type { CrdtType } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import { IndexedDBStorage } from "./IndexedDBStorage";

export interface AddonIndexedDBConfig<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> {
    enabled?: boolean | ((room: PluvRoom<TIO, TPresence, TStorage>) => boolean);
}

export const addonIndexedDB = <
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
>(
    config?: AddonIndexedDBConfig<TIO, TPresence, TStorage>,
): PluvRoomAddon<TIO, TPresence, TStorage> => {
    const { enabled = true } = config ?? {};

    return ({ room }) => {
        const _enabled = typeof enabled === "boolean" ? enabled : enabled(room);

        if (!_enabled) return {};

        return {
            storage: new IndexedDBStorage(room.id),
        };
    };
};
