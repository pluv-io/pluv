import { __internal } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { describe, expect, it } from "vitest";

const live = (id: string, user: { id: string } | null, presence: JsonObject = {}) =>
    ({
        id,
        presence,
        quit: false,
        room: "test",
        timers: { ping: Date.now(), presence: Date.now() },
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
                presence: { cursor: 1 },
            },
            {
                connectionIds: ["s-bob"],
                data: { id: "bob" },
                key: "bob",
                presence: { name: "bob" },
            },
        ]);
        expect(rows[0]).not.toHaveProperty("presenceTimer");
    });

    it("omits sockets without a user id", () => {
        expect(
            __internal.groupLiveUsers([live("s-ada", { id: "ada" }), live("s-anon-1", null)]),
        ).toEqual([
            {
                connectionIds: ["s-ada"],
                data: { id: "ada" },
                key: "ada",
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

    it("picks presence from the session with the newest timer", () => {
        const older = live("s-ada-1", { id: "ada" }, { cursor: 1 });
        const newer = live("s-ada-2", { id: "ada" }, { cursor: 9 });

        older.timers.presence = 1;
        newer.timers.presence = 2;

        expect(__internal.groupLiveUsers([older, newer])[0]?.presence).toEqual({ cursor: 9 });
        expect(__internal.groupLiveUsers([newer, older])[0]?.presence).toEqual({ cursor: 9 });
    });

    it("counts unique data.id values in room stats", () => {
        expect(
            __internal.getRoomStatsFromSessions([
                live("s-ada-1", { id: "ada" }),
                live("s-ada-2", { id: "ada" }),
                live("s-bob", { id: "bob" }),
                live("s-anon-1", null),
            ]),
        ).toEqual({ connectionCount: 4, userCount: 2 });
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
});
