import { createClient, infer } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle } from "@pluv/react";
import { ioServer } from "./io";

const types = infer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
    authEndpoint: (room) => `https://localhost:3000/api/auth?room=${room}`,
    initialStorage: yjs.doc(),
    types,
    wsEndpoint: (room) => `ws://localhost:3000/api/room/${room}`,
});

export const pluv = createBundle(client);
