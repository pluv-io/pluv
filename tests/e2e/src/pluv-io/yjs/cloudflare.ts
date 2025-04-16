import { createClient, infer } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/yjs/cloudflare";

const types = infer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
    authEndpoint: ({ metadata, room }) => {
        const url = new URL(`${metadata.authEndpoint}/api/pluv/authorize`);

        url.searchParams.set("room", room);

        if (typeof window !== "undefined") {
            const userId = new URL(window.location.href).searchParams.get("user_id");

            if (!!userId) url.searchParams.set("user_id", userId);
        }

        return url.toString();
    },
    initialStorage: yjs.doc(() => ({
        messages: yjs.array([
            yjs.object({
                message: "hello",
                name: "pluvrt",
            }),
        ]),
    })),
    metadata: z.object({
        authEndpoint: z.string().default("http://localhost:3101"),
    }),
    presence: z.object({
        count: z.number(),
    }),
    types,
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3101/api/pluv/room/${room}`;
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
