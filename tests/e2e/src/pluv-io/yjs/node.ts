import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { createClient } from "@pluv/client";
import { createBundle } from "@pluv/react";
import { z } from "zod";
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
    useTransact,
    useUndo,
} = bundle;
