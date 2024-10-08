import { loro } from "@pluv/crdt-loro";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/yjs/node";

const client = createClient({
    authEndpoint: ({ room }) => {
        return `http://localhost:3112/api/pluv/authorize?room=${room}`;
    },
    infer: (i) => ({ io: i<typeof ioServer> }),
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
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3112/api/pluv/room/${room}`;
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
} = createBundle(client);
