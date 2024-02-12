import { createBundle, createClient } from "@pluv/react";
import { type io } from "./io";
import { yjs } from "@pluv/crdt-yjs";

const client = createClient<typeof io>({
    authEndpoint: (room) => `https://localhost:3000/api/auth?room=${room}`,
    wsEndpoint: (room) => `ws://localhost:3000/api/room/${room}`,
});

export const { createRoomBundle } = createBundle(client);

export const { useBroadcast, useEvent, useMyself } =
    createRoomBundle({
        initialStorage: yjs.doc(),
    });
