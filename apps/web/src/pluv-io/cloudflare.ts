"use client";

import type { ioServer } from "@pluv-apps/server-cloudflare/src/pluv-io";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle, createClient } from "@pluv/react";
import { z } from "zod";
import tasks from "../generated/tasks.json";

const client = createClient<typeof ioServer>();

export const {
    // factories
    createRoomBundle,

    // components
    PluvProvider,

    // hooks
    useClient,
} = createBundle(client);

export const {
    // components
    MockedRoomProvider,
    PluvRoomProvider,

    // hooks
    useBroadcast,
    useConnection,
    useEvent,
    useMyPresence,
    useMyself,
    useOther,
    useOthers,
    useRoom,
    useStorage,
    useTransact,
} = createRoomBundle({
    presence: z.object({
        selectionId: z.string().nullable(),
    }),
    initialStorage: yjs.doc(() => ({
        demoTasks: yjs.array(tasks.map((task) => yjs.object(task))),
    })),
    wsEndpoint: ({ room }) => `${process.env.WS_ENDPOINT}/api/pluv/room/${room}`,
});
