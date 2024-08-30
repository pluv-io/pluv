import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/yjs/node";

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
    authEndpoint: ({ room }) => `http://localhost:3102/api/pluv/authorize?room=${room}`,
    addons: [
        addonIndexedDB({
            enabled: (room) => room.id === "e2e-node-storage-addon-indexeddb",
        }),
    ],
    initialStorage: yjs.doc(() => ({
        messages: yjs.array([
            yjs.object({
                message: "hello",
                name: "leedavidcs",
            }),
        ]),
    })),
    presence: z.object({
        count: z.number(),
    }),
    wsEndpoint: ({ room }) => `ws://localhost:3102/api/pluv/room/${room}`,
});
