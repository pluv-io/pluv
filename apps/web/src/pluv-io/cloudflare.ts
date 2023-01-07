import type { io } from "@pluv-apps/server-cloudflare/src/pluv-io";
import { createBundle, createClient, y } from "@pluv/react";
import { z } from "zod";

const client = createClient<typeof io>({
    authEndpoint: (roomName) => {
        return `http://localhost:8787/api/authorize?roomName=${roomName}`;
    },
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
        messages: y.array([
            y.unstable__object({
                message: "hello",
                name: "leedavidcs",
            }),
        ]),
    }),
    presence: z.object({
        cursor: z.nullable(
            z.object({
                x: z.number(),
                y: z.number(),
            })
        ),
    }),
});
