import type { io } from "@pluv-apps/server-cloudflare/src/pluv-io";
import { createBundle, createClient, y } from "@pluv/react";
import { z } from "zod";

const client = createClient<typeof io>({
    wsEndpoint: (roomName) => {
        return `ws://localhost:8787/api/room/${roomName}/websocket`;
    },
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
    initialStorage: () => ({
        demo: y.unstable__object({
            chessHistory: y.array(["e4"]),
        }),
    }),
});
