import { createClient } from "@pluv/client";
import { createBundle } from "@pluv/react";
import type { ioServer } from "@/io";
import { readName, readUserId } from "@/session";
import { treaty } from "@/treaty";

const client = createClient<typeof ioServer>().config({
    authEndpoint: ({ room }) => {
        const url = new URL("/api/pluv/auth", window.location.origin);

        url.searchParams.set("room", room);
        url.searchParams.set("user", readUserId());
        url.searchParams.set("name", readName());

        return url.toString();
    },
    initialStorage: { messages: [] },
    treaty,
    wsEndpoint: ({ room }) => `ws://127.0.0.1:8787/api/pluv/room/${room}`,
});

export const {
    PluvRoomProvider,
    useMyPresence,
    useOthers,
    usePresence,
    useStorage,
    useStorageField,
} = createBundle(client, { suspense: true });
