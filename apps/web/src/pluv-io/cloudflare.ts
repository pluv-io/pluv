import type { io } from "@pluv-apps/server-cloudflare/src/pluv-io";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";

const client = createClient<typeof io>({
    wsEndpoint: (room) => `${process.env.WS_ENDPOINT}/api/pluv/room/${room}`,
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
    MockedRoomProvider,
    PluvRoomProvider,

    // hooks
    useBroadcast,
    useConnection,
    useEvent,
    useMyPresence,
    useMyself,
    useOther,
    useOthers,
    useRoom,
    useStorage,
} = createRoomBundle({
    presence: z.object({
        demoChessSquare: z.nullable(z.string()),
    }),
    initialStorage: yjs.doc(() => ({
        demo: yjs.object({
            chessHistory: yjs.array(["e4"]),
        }),
    })),
});
