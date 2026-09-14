import type { ClientDefs, PluvRoom, PluvRoomAddon } from "@pluv/client";
import { IndexedDBStorage } from "./IndexedDBStorage";

export interface AddonIndexedDBConfig<TDefs extends ClientDefs = any> {
    enabled?: boolean | ((room: PluvRoom<TDefs>) => boolean);
}

export const addonIndexedDB = <TDefs extends ClientDefs = any>(
    config?: AddonIndexedDBConfig<TDefs>,
): PluvRoomAddon<any> => {
    const { enabled = true } = config ?? {};

    return ({ room }) => {
        const _enabled = typeof enabled === "boolean" ? enabled : enabled(room);

        if (!_enabled) return {};

        return {
            storage: new IndexedDBStorage(room.id),
        };
    };
};
