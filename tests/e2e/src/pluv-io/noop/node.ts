import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/noop/node";

const client = createClient({
    authEndpoint: ({ room }) => {
        return `http://localhost:3122/api/pluv/authorize?room=${room}`;
    },
    infer: (i) => ({ io: i<typeof ioServer> }),
    presence: z.object({
        count: z.number(),
    }),
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
    useTransact,
    useUndo,
} = createBundle(client, {
    addons: [
        addonIndexedDB({
            enabled: (room) => room.id === "e2e-node-storage-addon-indexeddb",
        }),
    ],
});
