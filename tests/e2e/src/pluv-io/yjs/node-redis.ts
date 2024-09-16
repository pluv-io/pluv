import { yjs } from "@pluv/crdt-yjs";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/yjs/node-redis";

const client = createClient({
    authEndpoint: ({ room }) => {
        const [roomName] = room.split("_");

        return `http://localhost:3103/api/authorize?roomName=${roomName}`;
    },
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
        const [roomName, io] = room.split("_");

        const url = new URL(`ws://localhost:3103/api/room/${roomName}/websocket`);

        if (io === "1") url.searchParams.set("io", "1");

        return url.toString();
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
} = createRoomBundle({});
