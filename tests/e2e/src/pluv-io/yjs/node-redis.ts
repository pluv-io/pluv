import { createClient, infer } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle } from "@pluv/react";
import { slateNodesToInsertDelta } from "@slate-yjs/core";
import { z } from "zod";
import type { ioServer } from "../../server/yjs/node-redis";

const types = infer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
    authEndpoint: ({ room }) => {
        const [roomName] = room.split("_");

        return `http://localhost:3103/api/authorize?roomName=${roomName}`;
    },
    initialStorage: yjs.doc((t) => ({
        messages: t.array("messages", [
            yjs.map([
                ["message", "hello"],
                ["name", "i3dly"],
            ]),
        ]),
        slate: (() => {
            const type = t.xmlText("slate");

            type.applyDelta(slateNodesToInsertDelta([]));

            return type;
        })(),
    })),
    presence: z.object({
        count: z.number(),
    }),
    types,
    wsEndpoint: ({ room }) => {
        const [roomName, io] = room.split("_");

        const url = new URL(`ws://localhost:3103/api/room/${roomName}/websocket`);

        if (io === "1") url.searchParams.set("io", "1");

        return url.toString();
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
    useTransact,
    useUndo,
} = createBundle(client);
