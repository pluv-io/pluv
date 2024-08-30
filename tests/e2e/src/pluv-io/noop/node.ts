import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/noop/node";

const client = createClient<typeof ioServer>();

export const {
    // factories
    createRoomBundle,

    // components
    PluvProvider,

    // hooks
    useClient,
} = createBundle(client);

export const {
    // components
    PluvRoomProvider,

    // hooks
    useBroadcast,
    useCanRedo,
    useCanUndo,
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
} = createRoomBundle({
    authEndpoint: ({ room }) => `http://localhost:3122/api/pluv/authorize?room=${room}`,
    addons: [
        addonIndexedDB({
            enabled: (room) => room.id === "e2e-node-storage-addon-indexeddb",
        }),
    ],
    presence: z.object({
        count: z.number(),
    }),
    wsEndpoint: ({ room }) => `ws://localhost:3122/api/pluv/room/${room}`,
});
