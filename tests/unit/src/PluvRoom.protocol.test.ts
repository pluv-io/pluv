import { PluvRoom } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const operator = { id: "staff-1", name: "Ada", imageUrl: null };

const flush = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
};

const createRoom = () => {
    const treaty = createTreaty({
        user: z.object({ id: z.string() }),
        presence: z.object({ name: z.string() }),
        storage: yjs.schema({ content: yjs.yText() }),
    }).router({});
    const room = new PluvRoom("protocol", {
        authEndpoint: () => "",
        limits: {},
        presence: treaty.presence,
        storage: treaty.storage,
        treaty,
        initialPresence: { name: "" },
        initialStorage: { content: "" },
    });
    const internal = room as unknown as {
        _onMessage: (event: { data: string }) => void;
        _state: { webSocket: { readyState: number; send: (data: string) => void } | null };
    };

    internal._state.webSocket = {
        readyState: WebSocket.OPEN,
        send() {},
    };

    const deliver = (
        type: string,
        data: unknown,
        envelope: { connectionId?: string | null; user?: { id: string } } = {},
    ) => {
        internal._onMessage({
            data: JSON.stringify({ type, data, ...envelope }),
        });
    };

    return { deliver, room };
};

const register = async (deliver: ReturnType<typeof createRoom>["deliver"]) => {
    deliver(
        "$registered",
        {
            sessionId: "session-1",
            state: null,
            stats: {
                user: { connectionCount: 2, userCount: 1 },
                operator: { connectionCount: 1, userCount: 1 },
            },
            session: {
                kind: "operator",
                operator,
                presence: { name: "ada" },
                seq: { presence: 1 },
            },
        },
        { connectionId: "session-1", user: { id: "owner:staff-1" } },
    );
    await flush();
};

describe("PluvRoom protocol payloads", () => {
    it("reads session and stats from $registered", async () => {
        const { deliver, room } = createRoom();

        await register(deliver);

        expect(room.getMyself()).toEqual({
            data: { id: "owner:staff-1" },
            kind: "operator",
            operator,
            presence: { name: "ada" },
        });
        expect(room.getRoomStats()).toEqual({ connectionCount: 2, userCount: 1 });
        expect(room.getRoomStats({ kinds: ["operator"] })).toEqual({
            connectionCount: 1,
            userCount: 1,
        });
    });

    it("reads both kind buckets from $roomStats", async () => {
        const { deliver, room } = createRoom();

        await register(deliver);
        deliver("$roomStats", {
            user: { connectionCount: 4, userCount: 3 },
            operator: { connectionCount: 2, userCount: 1 },
        });

        expect(room.getRoomStats()).toEqual({ connectionCount: 4, userCount: 3 });
        expect(room.getRoomStats({ kinds: ["operator"] })).toEqual({
            connectionCount: 2,
            userCount: 1,
        });
        expect(room.getRoomStats({ kinds: ["user", "operator"] })).toEqual({
            connectionCount: 6,
            userCount: 4,
        });
    });

    it("reads session from $userJoined", async () => {
        const { deliver, room } = createRoom();

        await register(deliver);
        deliver(
            "$userJoined",
            {
                connectionId: "session-2",
                user: { id: "bea" },
                session: {
                    kind: "user",
                    operator: null,
                    presence: { name: "bea" },
                    seq: { presence: 1 },
                },
            },
            { connectionId: "session-2" },
        );

        expect(room.getOthers()).toEqual([
            {
                data: { id: "bea" },
                kind: "user",
                operator: null,
                presence: { name: "bea" },
            },
        ]);
    });

    it("reads session from $presenceUpdated", async () => {
        const { deliver, room } = createRoom();

        await register(deliver);
        deliver(
            "$userJoined",
            {
                connectionId: "session-2",
                user: { id: "bea" },
                session: {
                    kind: "user",
                    operator: null,
                    presence: { name: "bea" },
                    seq: { presence: 1 },
                },
            },
            { connectionId: "session-2" },
        );
        deliver(
            "$presenceUpdated",
            {
                user: { id: "bea" },
                session: {
                    kind: "user",
                    operator: null,
                    presence: { name: "bea-2" },
                    seq: { presence: 2 },
                },
            },
            { connectionId: "session-2" },
        );

        expect(room.getOthers()).toEqual([
            {
                data: { id: "bea" },
                kind: "user",
                operator: null,
                presence: { name: "bea-2" },
            },
        ]);
    });

    it("reads session from $othersReceived", async () => {
        const { deliver, room } = createRoom();
        const staff = { id: "staff-2", name: "Bea", imageUrl: null };

        await register(deliver);
        deliver("$othersReceived", {
            myConnectionIds: ["session-1"],
            others: [
                {
                    connectionIds: ["session-3"],
                    data: { id: "cy" },
                    session: {
                        kind: "user",
                        operator: null,
                        presence: { name: "cy" },
                        seq: { presence: 1 },
                    },
                },
                {
                    connectionIds: ["session-4"],
                    data: { id: "owner:staff-2" },
                    session: {
                        kind: "operator",
                        operator: staff,
                        presence: { name: "staff" },
                        seq: { presence: 1 },
                    },
                },
            ],
        });

        expect(room.getOthers()).toEqual([
            {
                data: { id: "cy" },
                kind: "user",
                operator: null,
                presence: { name: "cy" },
            },
        ]);
        expect(room.getOthers({ kinds: ["operator"] })).toEqual([
            {
                data: { id: "owner:staff-2" },
                kind: "operator",
                operator: staff,
                presence: { name: "staff" },
            },
        ]);
    });
});
