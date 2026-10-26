import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { createClient } from "@pluv/client";
import { createBundle } from "@pluv/react";
import type { ioServer } from "../../server/yjs/node";
import { treaty } from "./treaty";

const io = createClient<typeof ioServer>().config({
    authEndpoint: ({ room }) => {
        return `http://localhost:3102/api/pluv/authorize?room=${room}`;
    },
    debug: true,
    treaty,
    initialStorage: {
        messages: [
            {
                message: "hello",
                name: "i3dly",
            },
        ],
    },
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3102/api/pluv/room/${room}`;
    },
});

export const bundle = createBundle(io, {
    addons: [
        addonIndexedDB({
            enabled: (room) => room.id === "e2e-node-storage-addon-indexeddb",
        }),
    ],
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
    useDoc,
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
} = bundle;
