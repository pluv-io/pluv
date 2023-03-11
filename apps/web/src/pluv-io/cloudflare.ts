import type { io } from "@pluv-apps/server-cloudflare/src/pluv-io";
import { createBundle, createClient, y } from "@pluv/react";
import { z } from "zod";

const client = createClient<typeof io>({
    wsEndpoint: (room) => `${process.env.WS_ENDPOINT}/api/room/${room}`,
});

export const {
    // factories
    createRoomBundle,

    // components
    PluvProvider,

    // hooks
    usePluvClient,
} = createBundle(client);

export const {
    // components
    MockedRoomProvider,
    PluvRoomProvider,

    // hooks
    usePluvBroadcast,
    usePluvConnection,
    usePluvEvent,
    usePluvMyPresence,
    usePluvMyself,
    usePluvOther,
    usePluvOthers,
    usePluvRoom,
    usePluvStorage,
} = createRoomBundle({
    presence: z.object({
        demoChessSquare: z.nullable(z.string()),
    }),
    initialStorage: () => ({
        demo: y.object({
            chessHistory: y.array(["e4"]),
        }),
    }),
});
