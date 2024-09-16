import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/yjs/node";

const io = createClient({
    authEndpoint: ({ room }) => {
        return `http://localhost:3102/api/pluv/authorize?room=${room}`;
    },
    debug: true,
    infer: (i) => ({ io: i<typeof ioServer> }),
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
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3102/api/pluv/room/${room}`;
    },
});

export const {
    // factories
    createRoomBundle,

    // components
    PluvProvider,

    // hooks
    useClient,
} = createBundle(io);

export const {
    // components
    PluvRoomProvider,

    // proxies
    event,

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
    addons: [
        addonIndexedDB({
            enabled: (room) => room.id === "e2e-node-storage-addon-indexeddb",
        }),
    ],
    router: io.router({
        subtract5: io.procedure
            .input(
                z.object({
                    value: z.number(),
                }),
            )
            .broadcast(({ value }) => ({
                doubleNumber: { value: value - 5 },
                subtractedNumber: { value: value - 5 },
            })),
    }),
});
