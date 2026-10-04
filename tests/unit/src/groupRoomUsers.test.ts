import { __internal } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { describe, expect, it } from "vitest";

const live = (id: string, user: JsonObject | null, presence: JsonObject = {}) =>
    ({
        id,
        kind: "user",
        operator: null,
        presence,
        quit: false,
        room: "test",
        timers: { ping: Date.now() },
        seq: { presence: Date.now() },
        user,
        webSocket: {} as any,
    }) as any;

describe("groupRoomUsers", () => {
    it("groups authorized users by data.id", () => {
        const rows = __internal.groupLiveUsers([
            live("s-ada-1", { id: "ada" }, { cursor: 1 }),
            live("s-ada-2", { id: "ada" }, { cursor: 1 }),
            live("s-bob", { id: "bob" }, { name: "bob" }),
        ]);

        expect(rows).toEqual([
            {
                connectionIds: ["s-ada-1", "s-ada-2"],
                data: { id: "ada" },
                key: "ada",
                kind: "user",
                operator: null,
                presence: { cursor: 1 },
            },
            {
                connectionIds: ["s-bob"],
                data: { id: "bob" },
                key: "bob",
                kind: "user",
                operator: null,
                presence: { name: "bob" },
            },
        ]);
        expect(rows[0]).not.toHaveProperty("presenceSeq");
    });

    it("omits sockets without a user id", () => {
        expect(
            __internal.groupLiveUsers([live("s-ada", { id: "ada" }), live("s-anon-1", null)]),
        ).toEqual([
            {
                connectionIds: ["s-ada"],
                data: { id: "ada" },
                key: "ada",
                kind: "user",
                operator: null,
                presence: {},
            },
        ]);
    });

    it("omits the requester's user from $others grouping", () => {
        const rows = __internal.groupLiveUsers(
            [
                live("s-ada-1", { id: "ada" }),
                live("s-ada-2", { id: "ada" }),
                live("s-bob", { id: "bob" }),
            ],
            { excludeSessionId: "s-ada-1" },
        );

        expect(rows.map((row) => row.key)).toEqual(["bob"]);
    });

    it("picks presence from the session with the newest seq", () => {
        const older = live("s-ada-1", { id: "ada", name: "old" }, { cursor: 1 });
        const newer = live("s-ada-2", { id: "ada", name: "new" }, { cursor: 9 });

        older.seq.presence = 1;
        newer.seq.presence = 2;

        const forward = __internal.groupLiveUsers([older, newer])[0];
        const reverse = __internal.groupLiveUsers([newer, older])[0];

        expect(forward?.presence).toEqual({ cursor: 9 });
        expect(forward?.data).toEqual({ id: "ada", name: "new" });
        expect(reverse?.presence).toEqual({ cursor: 9 });
        expect(reverse?.data).toEqual({ id: "ada", name: "new" });
    });

    it("counts unique data.id values in room stats", () => {
        expect(
            __internal.getRoomStatsFromSessions([
                live("s-ada-1", { id: "ada" }),
                live("s-ada-2", { id: "ada" }),
                live("s-bob", { id: "bob" }),
                live("s-anon-1", null),
            ]),
        ).toEqual({
            connectionCount: 4,
            userCount: 2,
            operators: { connectionCount: 0, userCount: 0 },
        });
    });

    it("pages with a lex cursor that is still set on the last page", () => {
        const sessions = [
            live("s-ada", { id: "ada" }),
            live("s-bob", { id: "bob" }),
            live("s-cara", { id: "cara" }),
        ];
        const first = __internal.listLiveUsers(sessions, { limit: 2 });

        expect(first).toEqual({
            pageInfo: { endCursor: "bob", hasNextPage: true },
            users: [{ data: { id: "ada" } }, { data: { id: "bob" } }],
        });

        const last = __internal.listLiveUsers(sessions, {
            cursor: first.pageInfo.endCursor,
            limit: 2,
        });

        expect(last).toEqual({
            pageInfo: { endCursor: "cara", hasNextPage: false },
            users: [{ data: { id: "cara" } }],
        });

        const empty = __internal.listLiveUsers(sessions, {
            cursor: last.pageInfo.endCursor,
            limit: 2,
        });

        expect(empty).toEqual({
            pageInfo: { endCursor: null, hasNextPage: false },
            users: [],
        });
    });

    it("groups operators by user id", () => {
        const occupant = live("s-ada", { id: "ada" }, { name: "player" });
        const operator = live("s-staff", { id: "ada" }, { name: "staff" });

        operator.kind = "operator";
        operator.operator = {
            id: "staff-1",
            name: "Ada",
            imageUrl: null,
        };

        const rows = __internal.groupLiveUsers([occupant, operator]);

        expect(rows.map((row) => `${row.kind}:${row.key}`).toSorted()).toEqual([
            "operator:ada",
            "user:ada",
        ]);
        expect(rows.find((row) => row.kind === "operator")).toMatchObject({
            connectionIds: ["s-staff"],
            data: { id: "ada" },
            operator: operator.operator,
            presence: { name: "staff" },
        });
        expect(__internal.listLiveUsers([occupant, operator], { limit: 10 }).users).toEqual([
            { data: { id: "ada" } },
        ]);
        expect(__internal.getRoomStatsFromSessions([occupant, operator])).toEqual({
            connectionCount: 1,
            userCount: 1,
            operators: { connectionCount: 1, userCount: 1 },
        });
    });

    it("counts operators that share a treaty user id as one person", () => {
        const first = live("s-1", { id: "ada" });
        const second = live("s-2", { id: "ada" });

        first.kind = "operator";
        second.kind = "operator";
        first.operator = { id: "staff-1", name: "Ada", imageUrl: null };
        second.operator = { id: "staff-2", name: "Ada", imageUrl: null };

        expect(__internal.getRoomStatsFromSessions([first, second])).toEqual({
            connectionCount: 0,
            userCount: 0,
            operators: { connectionCount: 2, userCount: 1 },
        });
        expect(__internal.getMyConnectionIds([first, second], first).toSorted()).toEqual([
            "s-1",
            "s-2",
        ]);
    });

    it("keeps data and operator from the socket with the newest presence seq", () => {
        const older = live("s-1", { id: "ada", name: "old" }, { cursor: 1 });
        const newer = live("s-2", { id: "ada", name: "new" }, { cursor: 9 });

        older.kind = "operator";
        newer.kind = "operator";
        older.operator = { id: "staff-1", name: "Old", imageUrl: null };
        newer.operator = { id: "staff-2", name: "New", imageUrl: "https://example.com/new.png" };
        older.seq.presence = 1;
        newer.seq.presence = 2;

        const row = __internal.groupLiveUsers([older, newer])[0];

        expect(row).toMatchObject({
            connectionIds: ["s-1", "s-2"],
            data: { id: "ada", name: "new" },
            operator: newer.operator,
            presence: { cursor: 9 },
        });
        expect(__internal.groupLiveUsers([newer, older])[0]).toMatchObject({
            data: { id: "ada", name: "new" },
            operator: newer.operator,
            presence: { cursor: 9 },
        });
    });

    it("does not merge a user id with an operator id", () => {
        const occupant = live("s-player", { id: "operator:staff-1" }, { name: "player" });
        const operator = live("s-staff", { id: "ada" }, { name: "staff" });

        operator.kind = "operator";
        operator.operator = {
            id: "staff-1",
            name: "Ada",
            imageUrl: null,
        };

        const rows = __internal.groupLiveUsers([occupant, operator]);

        expect(rows).toEqual([
            {
                connectionIds: ["s-player"],
                data: { id: "operator:staff-1" },
                key: "operator:staff-1",
                kind: "user",
                operator: null,
                presence: { name: "player" },
            },
            {
                connectionIds: ["s-staff"],
                data: { id: "ada" },
                key: "ada",
                kind: "operator",
                operator: operator.operator,
                presence: { name: "staff" },
            },
        ]);
    });
});
