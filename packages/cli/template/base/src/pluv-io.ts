import { createBundle, createClient, y } from "@pluv/react";
import { z } from "zod";
import { type io } from "./server";

const client = createClient<typeof io>({
    authEndpoint: (roomName) => {
        return `http://localhost:3001/api/authorize?room=${roomName}`;
    },
    wsEndpoint: (roomName) => {
        return `ws://localhost:3001/api/room/${roomName}`
    }
});

export const Pluv = createBundle(client);

export const PluvRoom = Pluv.createRoomBundle({
    initialStorage: () => ({
        messages: y.array([
            y.object({
                message: "Thanks for trying Pluv.IO!",
                name: "pluv"
            }),
        ]),
    }),
    presence: z.object({
        count: z.number(),
    }),
});
