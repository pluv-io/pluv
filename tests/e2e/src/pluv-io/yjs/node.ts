import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { createClient, infer } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle } from "@pluv/react";
import { z } from "zod";
import { ioServer } from "../../server/yjs/node";

const types = infer((i) => ({ io: i<typeof ioServer> }));
const io = createClient({
    authEndpoint: ({ room }) => {
        return `http://localhost:3102/api/pluv/authorize?room=${room}`;
    },
    debug: true,
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
    types,
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3102/api/pluv/room/${room}`;
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
} = createBundle(io, {
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
