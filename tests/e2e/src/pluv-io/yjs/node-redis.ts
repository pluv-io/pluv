import { createClient } from "@pluv/client";
import { createBundle } from "@pluv/react";
import type { ioServer } from "../../server/yjs/node-redis";
import { treaty } from "./node-redis-treaty";

const client = createClient<typeof ioServer>().config({
    authEndpoint: ({ room }) => {
        return `http://localhost:3103/api/authorize?roomName=${room}`;
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
    wsEndpoint: ({ room }) => {
        return `ws://localhost:3103/api/room/${room}/websocket`;
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
} = createBundle(client);
