import type { AbstractType, PluvRoom, PluvRoomAddon } from "@pluv/client";
import type { IOLike, JsonObject } from "@pluv/types";
import { IndexedDBStorage } from "./IndexedDBStorage";

export interface AddonIndexedDBConfig<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
> {
    enabled?: boolean | ((room: PluvRoom<TIO, TPresence, TStorage>) => boolean);
}

export const addonIndexedDB = <
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
>(
    config?: AddonIndexedDBConfig<TIO, TPresence, TStorage>
): PluvRoomAddon<TIO, TPresence, TStorage> => {
    const { enabled = true } = config ?? {};

    return ({ room }) => {
        const _enabled = typeof enabled === "boolean" ? enabled : enabled(room);

        return {
            storage: _enabled ? new IndexedDBStorage(room.id) : undefined,
        };
    };
};
