import { createBundle, createClient, y } from "@pluv/react";
import { z } from "zod";
import type { io } from "../server/node-redis";

const client = createClient<typeof io>({
    authEndpoint: (roomName) => {
        const [room] = roomName.split("_");

        return `http://localhost:3103/api/authorize?roomName=${room}`;
    },
    wsEndpoint: (roomName) => {
        const [room, io] = roomName.split("_");

        const url = new URL(`ws://localhost:3103/api/room/${room}/websocket`);

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
            y.object({
                message: "hello",
                name: "leedavidcs",
            }),
        ]),
    }),
    presence: z.object({
        count: z.number(),
    }),
});
