import type { PluvRoom, PluvRoomAddon } from "@pluv/client";
import type { CrdtType } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import { IndexedDBStorage } from "./IndexedDBStorage";

export interface AddonIndexedDBConfig<
    TIO extends IOLike,
    TMetadata extends JsonObject = {},
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> {
    enabled?: boolean | ((room: PluvRoom<TIO, TMetadata, TPresence, TStorage>) => boolean);
}

export const addonIndexedDB = <
    TIO extends IOLike,
    TMetadata extends JsonObject = {},
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
>(
    config?: AddonIndexedDBConfig<TIO, TMetadata, TPresence, TStorage>,
): PluvRoomAddon<TIO, TMetadata, TPresence, TStorage> => {
    const { enabled = true } = config ?? {};

    return ({ room }) => {
        const _enabled = typeof enabled === "boolean" ? enabled : enabled(room);

        if (!_enabled) return {};

        return {
            storage: new IndexedDBStorage(room.id),
        };
    };
};
