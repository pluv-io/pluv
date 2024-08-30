import { loro } from "@pluv/crdt-loro";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/yjs/node";

const client = createClient<typeof ioServer>({});

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
    authEndpoint: (room) => `http://localhost:3112/api/pluv/authorize?room=${room}`,
    initialStorage: loro.doc(() => ({
        messages: loro.list([
            loro.object({
                message: "hello",
                name: "leedavidcs",
            }),
        ]),
    })),
    presence: z.object({
        count: z.number(),
    }),
    wsEndpoint: (room) => `ws://localhost:3112/api/pluv/room/${room}`,
});
