import type { AbstractType, PluvRoomAddon } from "@pluv/client";
import type { IOLike, JsonObject } from "@pluv/types";
import { IndexedDBStorage } from "./IndexedDBStorage";

export const addonIndexedDB = <
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
>(): PluvRoomAddon<TIO, TPresence, TStorage> => {
    return ({ room }) => ({
        storage: new IndexedDBStorage(room.id),
    });
};
