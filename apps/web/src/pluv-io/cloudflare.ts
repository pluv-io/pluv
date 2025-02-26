"use client";

import { ioServer } from "@pluv-apps/server-cloudflare/src/pluv-io";
import { createClient, infer } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle } from "@pluv/react";
import { z } from "zod";
import tasks from "../generated/tasks.json";

const types = infer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
    initialStorage: yjs.doc(() => ({
        demoTasks: yjs.array(tasks.map((task) => yjs.object(task))),
    })),
    presence: z.object({
        selectionId: z.string().nullable(),
    }),
    types,
    wsEndpoint: ({ room }) => `${process.env.WS_ENDPOINT}/api/pluv/room/${room}`,
});

export const {
    // components
    MockedRoomProvider,
    PluvProvider,
    PluvRoomProvider,

    // hooks
    useBroadcast,
    useClient,
    useConnection,
    useEvent,
    useMyPresence,
    useMyself,
    useOther,
    useOthers,
    useRoom,
    useStorage,
    useTransact,
} = createBundle(client);
