import { createBundle, createClient, y } from "@pluv/react";
import { z } from "zod";
import type { io } from "../server/node";

const client = createClient<typeof io>({
    authEndpoint: (roomName) => {
        return `http://localhost:3102/api/authorize?roomName=${roomName}`;
    },
    wsEndpoint: (roomName) => {
        return `ws://localhost:3102/api/room/${roomName}/websocket`;
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
        count: z.number(),
    }),
});
