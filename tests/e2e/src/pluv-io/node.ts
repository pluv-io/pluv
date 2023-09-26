import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { createBundle, createClient, y } from "@pluv/react";
import { z } from "zod";
import type { io } from "../server/node";

const client = createClient<typeof io>({
    authEndpoint: (room) => {
        return `http://localhost:3102/api/pluv/authorize?room=${room}`;
    },
    wsEndpoint: (room) => {
        return `ws://localhost:3102/api/pluv/room/${room}`;
    },
});

export const {
    // factories
    createRoomBundle,

    // components
    PluvProvider,

    // hooks
    usePluvClient,
} = createBundle(client);

export const {
    // components
    PluvRoomProvider,

    // hooks
    usePluvBroadcast,
    usePluvCanRedo,
    usePluvCanUndo,
    usePluvConnection,
    usePluvEvent,
    usePluvMyPresence,
    usePluvMyself,
    usePluvOther,
    usePluvOthers,
    usePluvRedo,
    usePluvRoom,
    usePluvStorage,
    usePluvTransact,
    usePluvUndo,
} = createRoomBundle({
    addons: [
        addonIndexedDB({
            enabled: (room) => room.id === "e2e-node-storage-addon-indexeddb",
        }),
    ],
    initialStorage: () => ({
        messages: y.array([
            y.object({
                message: "hello",
                name: "leedavidcs",
            }),
        ]),
    }),
    presence: z.object({
        count: z.number(),
    }),
});
