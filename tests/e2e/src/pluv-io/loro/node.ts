import { loro } from "@pluv/crdt-loro";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import type { io } from "../../server/yjs/node";

const client = createClient<typeof io>({
    authEndpoint: (room) => {
        return `http://localhost:3112/api/pluv/authorize?room=${room}`;
    },
    wsEndpoint: (room) => {
        return `ws://localhost:3112/api/pluv/room/${room}`;
    },
});

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
    initialStorage: loro.doc(() => ({
        messages: loro.array([
            loro.object({
                message: "hello",
                name: "leedavidcs",
            }),
        ]),
    })),
    presence: z.object({
        count: z.number(),
    }),
});
