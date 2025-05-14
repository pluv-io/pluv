import type { PluvRoom, PluvRoomAddon } from "@pluv/client";
import type { AbstractCrdtDocFactory, CrdtType } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import { IndexedDBStorage } from "./IndexedDBStorage";

export interface AddonIndexedDBConfig<
    TIO extends IOLike<any, any>,
    TMetadata extends JsonObject,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
> {
    enabled?: boolean | ((room: PluvRoom<TIO, TMetadata, TPresence, TCrdt>) => boolean);
}

export const addonIndexedDB = <
    TIO extends IOLike<any, any>,
    TMetadata extends JsonObject,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
>(
    config?: AddonIndexedDBConfig<TIO, TMetadata, TPresence, TCrdt>,
): PluvRoomAddon<TIO, TMetadata, TPresence, TCrdt> => {
    const { enabled = true } = config ?? {};

    return ({ room }) => {
        const _enabled = typeof enabled === "boolean" ? enabled : enabled(room);

        if (!_enabled) return {};

        return {
            storage: new IndexedDBStorage(room.id),
        };
    };
};
