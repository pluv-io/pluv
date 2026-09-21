import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { createClient } from "@pluv/client";
import { createBundle } from "@pluv/react";
import type { ioServer } from "../../server/noop/node";
import { treaty } from "./treaty";

const client = createClient<typeof ioServer>().config({
    authEndpoint: ({ room }) => {
        return `http://localhost:3122/api/pluv/authorize?room=${room}`;
    },
    treaty,
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3122/api/pluv/room/${room}`;
    },
});

export const {
    // proxies
    event,

    // components
    PluvProvider,
    PluvRoomProvider,

    // hooks
    useBroadcast,
    useCanRedo,
    useCanUndo,
    useClient,
    useConnection,
    useEvent,
    useMyPresence,
    useMyself,
    useOther,
    useOthers,
    useRedo,
    useRoom,
    useStorage,
    useStorageField,
    useTransact,
    useUndo,
} = createBundle(client, {
    addons: [
        addonIndexedDB({
            enabled: (room) => room.id === "e2e-node-storage-addon-indexeddb",
        }),
    ],
});
