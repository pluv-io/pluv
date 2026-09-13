import { createClient, infer } from "@pluv/client";
import { s } from "@pluv/crdt";
import { loro } from "@pluv/crdt-loro";
import { createBundle } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/loro/node";

const types = infer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
    authEndpoint: ({ room }) => {
        return `http://localhost:3112/api/pluv/authorize?room=${room}`;
    },
    storage: loro.storage({
        schema: loro.schema({
            messages: loro.loroList(loro.loroMap(s.string())),
        }),
    }),
    initialStorage: {
        messages: [
            {
                message: "hello",
                name: "pluvrt",
            },
        ],
    },
    presence: z.object({
        count: z.number(),
    }),
    types,
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
