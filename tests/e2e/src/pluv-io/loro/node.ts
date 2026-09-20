import { createClient } from "@pluv/client";
import { createBundle } from "@pluv/react";
import type { ioServer } from "../../server/loro/node";
import { treaty } from "./treaty";

const client = createClient<typeof ioServer>().config({
    authEndpoint: ({ room }) => {
        return `http://localhost:3112/api/pluv/authorize?room=${room}`;
    },
    treaty,
    initialStorage: {
        messages: [
            {
                message: "hello",
                name: "pluvrt",
            },
        ],
    },
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3112/api/pluv/room/${room}`;
    },
});

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
} = createBundle(client);
