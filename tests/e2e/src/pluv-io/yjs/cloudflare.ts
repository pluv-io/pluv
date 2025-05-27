import { createClient, infer } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle } from "@pluv/react";
import { slateNodesToInsertDelta } from "@slate-yjs/core";
import { z } from "zod";
import type { ioServerSqlite } from "../../server/yjs/cloudflare";

const types = infer((i) => ({ io: i<typeof ioServerSqlite> }));
const client = createClient({
    authEndpoint: ({ metadata, room }) => {
        const url = new URL(`${metadata.authEndpoint}/api/pluv/authorize`);

        url.searchParams.set("room", room);

        if (typeof window !== "undefined") {
            const userId = new URL(window.location.href).searchParams.get("user_id");

            if (!!userId) url.searchParams.set("user_id", userId);
        }

        return url.toString();
    },
    initialStorage: yjs.doc((t) => ({
        blocknote: t.xmlFragment("blocknote"),
        messages: t.array("messages", [
            yjs.map([
                ["message", "hello"],
                ["name", "i3dly"],
            ]),
        ]),
        root: t.xmlText("root"),
        slate: (() => {
            const type = t.xmlText("slate");

            type.applyDelta(slateNodesToInsertDelta([]));

            return type;
        })(),
    })),
    metadata: z.object({
        authEndpoint: z.string().default("http://localhost:3101"),
    }),
    presence: z.object({
        blocknote: z.any().default({}),
        count: z.number(),
        lexical: z.any().default({}),
    }),
    types,
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
    useTransact,
    useUndo,
} = bundle;
