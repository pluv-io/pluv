import { yjs } from "@pluv/crdt-yjs";
import { createBundle, createClient } from "@pluv/react";
import { ioServer } from "./io";

const client = createClient<typeof ioServer>();

export const { createRoomBundle } = createBundle(client);

export const pluv = createRoomBundle({
    authEndpoint: ({ room }) => `https://localhost:3000/api/auth?room=${room}`,
    initialStorage: yjs.doc(),
    wsEndpoint: ({ room }) => `ws://localhost:3000/api/room/${room}`,
});
