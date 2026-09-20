import { createClient } from "@pluv/client";
import { createBundle } from "@pluv/react";
import { z } from "zod";
import type { ioServer } from "../../server/yjs/cloudflare";
import { treaty } from "./cloudflare-treaty";

const client = createClient<typeof ioServer>().config({
    authEndpoint: ({ metadata, room }) => {
        const url = new URL(`${metadata.authEndpoint}/api/pluv/authorize`);

        url.searchParams.set("room", room);

        if (typeof window !== "undefined") {
            const userId = new URL(window.location.href).searchParams.get("user_id");

            if (!!userId) url.searchParams.set("user_id", userId);
        }

        return url.toString();
    },
    treaty,
    initialStorage: {
        messages: [
            {
                message: "hello",
                name: "i3dly",
            },
        ],
    },
    metadata: z.object({
        authEndpoint: z.string().default("http://localhost:3101"),
    }),
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3101/api/pluv/room/${room}`;
    },
});

export const bundle = createBundle(client);

export const {
    // proxies
    event,

    // components
    PluvProvider,
    PluvRoomProvider,

    // hooks
    useBroadcast,
    useCanRedo,
    useCanUndo,
    useClient,
    useConnection,
    useDoc,
    useEvent,
    useMyPresence,
    useMyself,
    useOther,
    useOthers,
    useRedo,
    useRoom,
    useStorage,
    useStorageField,
    useTransact,
    useUndo,
} = bundle;
