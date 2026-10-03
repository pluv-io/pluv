import { UsersManager } from "../../../packages/client/src/UsersManager";
import { describe, expect, it } from "vitest";

const createManager = () => {
    return new UsersManager<any, { cursor?: number; name?: string }>({
        initialPresence: {},
        limits: { presenceMaxSize: 512 },
    });
};

describe("UsersManager", () => {
    it("looks up people by data.id and maps sockets via getOtherByConnectionId", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "ada-tab-1",
            data: { id: "ada" },
            kind: "user",
            presence: { name: "ada" },
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 1, name: "bob" },
        });
        manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 9, name: "bob" },
        });

        const other = manager.getOther("bob");

        expect(other).toEqual({
            data: { id: "bob" },
            kind: "user",
            operator: null,
            presence: { cursor: 1, name: "bob" },
        });
        expect(other).not.toHaveProperty("connectionId");
        expect(other).not.toHaveProperty("connectionIds");
        expect(other).not.toHaveProperty("user");
        expect(manager.getOtherByConnectionId("bob-tab-2")).toEqual(other);
        expect(manager.getOthers()).toHaveLength(1);
    });

    it("replaces others from a people snapshot and keeps sibling tabs internal", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "ada-tab-1",
            data: { id: "ada" },
            kind: "user",
            presence: { name: "ada" },
        });
        manager.addConnection({
            connectionId: "old",
            data: { id: "old" },
            kind: "user",
            presence: { name: "old" },
        });

        const left = manager.replaceOthers([
            {
                connectionIds: ["bob-tab-1", "bob-tab-2"],
                data: { id: "bob" },
                kind: "user",
                presence: { cursor: 2 },
            },
        ]);
        manager.setMyConnectionIds(["ada-tab-1", "ada-tab-2"]);

        expect(left).toEqual([{ id: "old", kind: "user" }]);
        expect(manager.getOthers().map((other) => other.data)).toEqual([{ id: "bob" }]);
        expect(manager.getOtherByConnectionId("bob-tab-2")?.data).toEqual({ id: "bob" });
        expect(manager.getOtherByConnectionId("ada-tab-2")).toBeNull();
        expect(manager.myself).toEqual({
            data: { id: "ada" },
            kind: "user",
            operator: null,
            presence: { name: "ada" },
        });
        expect(manager.myself).not.toHaveProperty("connectionIds");
    });

    it("keeps extra-tab addConnection from replacing presence until a write", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });

        const first = manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 1, name: "bob" },
        });
        const second = manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 9, name: "other-tab" },
        });

        expect(first.remaining).toBe(1);
        expect(first.presenceChanged).toBe(true);
        expect(second.remaining).toBe(2);
        expect(second.presenceChanged).toBe(false);
        expect(second.data).toEqual({
            data: { id: "bob" },
            kind: "user",
            operator: null,
            presence: { cursor: 1, name: "bob" },
        });
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 1, name: "bob" });

        manager.setPresence("bob-tab-2", { cursor: 9, name: "other-tab" });

        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 9, name: "other-tab" });

        const firstLeave = manager.deleteConnection("bob-tab-1");

        expect(firstLeave?.remaining).toBe(1);
        expect(manager.getOther("bob")).not.toBeNull();

        const lastLeave = manager.deleteConnection("bob-tab-2");

        expect(lastLeave?.remaining).toBe(0);
        expect(manager.getOther("bob")).toBeNull();
    });

    it("applies extra-tab presence only when the seq is newer", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });

        const first = manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 1 },
            presenceSeq: 10,
        });
        const stale = manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 9 },
            presenceSeq: 9,
        });
        const newer = manager.addConnection({
            connectionId: "bob-tab-3",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 3 },
            presenceSeq: 11,
        });

        expect(first.presenceChanged).toBe(true);
        expect(stale.presenceChanged).toBe(false);
        expect(newer.presenceChanged).toBe(true);
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 3 });
    });

    it("skips a stale presence patch and applies a newer one", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 1 },
            presenceSeq: 10,
        });

        const stale = manager.patchPresence({
            connectionId: "bob-tab-1",
            kind: "user",
            operator: null,
            presence: { cursor: 9 },
            seq: { presence: 9 },
            user: { id: "bob" },
        });
        const newer = manager.patchPresence({
            connectionId: "bob-tab-1",
            kind: "user",
            operator: null,
            presence: { cursor: 3 },
            seq: { presence: 11 },
            user: { id: "bob" },
        });

        expect(stale).toEqual({ applied: false, presence: { cursor: 1 } });
        expect(newer).toEqual({ applied: true, presence: { cursor: 3 } });
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 3 });
    });

    it("keeps last-write-wins seqs when replacing others from a snapshot", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });
        manager.replaceOthers([
            {
                connectionIds: ["bob-tab-1"],
                data: { id: "bob" },
                kind: "user",
                presence: { cursor: 2 },
                presenceSeq: 20,
            },
        ]);

        const stale = manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 1 },
            presenceSeq: 10,
        });

        expect(stale.presenceChanged).toBe(false);
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 2 });
    });

    it("keeps a newer local presence when a snapshot is older", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 3 },
            presenceSeq: 20,
        });

        const left = manager.replaceOthers([
            {
                connectionIds: ["bob-tab-1", "bob-tab-2"],
                data: { id: "bob" },
                kind: "user",
                presence: { cursor: 1 },
                presenceSeq: 10,
            },
        ]);

        expect(left).toEqual([]);
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 3 });
        expect(manager.getOtherByConnectionId("bob-tab-2")?.presence).toEqual({ cursor: 3 });
    });

    it("keeps your presence sequence when replacing others", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: { cursor: 5 },
            presenceSeq: 20,
        });
        manager.replaceOthers([
            {
                connectionIds: ["bob-tab-1"],
                data: { id: "bob" },
                kind: "user",
                presence: { cursor: 1 },
                presenceSeq: 1,
            },
        ]);

        const echo = manager.patchPresence({
            connectionId: "me",
            kind: "user",
            operator: null,
            presence: { cursor: 1 },
            seq: { presence: 10 },
            user: { id: "me" },
        });

        expect(echo).toEqual({ applied: false, presence: { cursor: 5 } });
    });

    it("copies data and operator from a newer presence update", () => {
        const manager = createManager();
        const previous = { id: "staff-1", name: "Old", imageUrl: null };
        const next = { id: "staff-2", name: "New", imageUrl: "https://example.com/new.png" };

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });
        manager.addConnection({
            connectionId: "staff-tab",
            data: { id: "ada" },
            kind: "operator",
            operator: previous,
            presence: { cursor: 1 },
            presenceSeq: 2,
        });

        const stale = manager.patchPresence({
            connectionId: "staff-tab",
            kind: "operator",
            operator: { id: "staff-9", name: "Stale", imageUrl: null },
            presence: { cursor: 0 },
            seq: { presence: 1 },
            user: { id: "ada" },
        });
        const applied = manager.patchPresence({
            connectionId: "staff-tab",
            kind: "operator",
            operator: next,
            presence: { cursor: 9 },
            seq: { presence: 3 },
            user: { id: "ada" },
        });

        expect(stale).toEqual({ applied: false, presence: { cursor: 1 } });
        expect(applied).toEqual({ applied: true, presence: { cursor: 9 } });
        expect(manager.getOther("ada", { kind: "operator" })).toEqual({
            data: { id: "ada" },
            kind: "operator",
            operator: next,
            presence: { cursor: 9 },
        });
    });

    it("applies an equal-seq presence patch as last-write-wins", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            kind: "user",
            presence: { cursor: 1 },
            presenceSeq: 10,
        });

        const equal = manager.patchPresence({
            connectionId: "bob-tab-1",
            kind: "user",
            operator: null,
            presence: { cursor: 9 },
            seq: { presence: 10 },
            user: { id: "bob" },
        });

        expect(equal).toEqual({ applied: true, presence: { cursor: 9 } });
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 9 });
    });

    it("does not stamp a seq on a local presence write", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "ada-tab-1",
            data: { id: "ada" },
            kind: "user",
            presence: {},
            presenceSeq: 10,
        });
        manager.updateMyPresence({ cursor: 1 });

        const sibling = manager.patchPresence({
            connectionId: "ada-tab-1",
            kind: "user",
            operator: null,
            presence: { cursor: 2 },
            seq: { presence: 11 },
            user: { id: "ada" },
        });

        expect(sibling).toEqual({ applied: true, presence: { cursor: 2 } });
        expect(manager.myself?.presence).toEqual({ cursor: 2 });
    });

    it("prunes only people whose last connection dropped", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            kind: "user",
            presence: { name: "bob" },
        });
        manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            kind: "user",
            presence: { name: "bob" },
        });
        manager.addConnection({
            connectionId: "cara-tab-1",
            data: { id: "cara" },
            kind: "user",
            presence: { name: "cara" },
        });

        expect(
            manager.pruneConnections(new Set(["bob-tab-2"])).map((user) => user.data.id),
        ).toEqual(["cara"]);
        expect(manager.getOther("bob")).not.toBeNull();
        expect(manager.getOther("cara")).toBeNull();
    });

    it("skips own presence echoes until the last in-flight write acks", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: { cursor: 0 },
            presenceSeq: 40,
        });

        manager.beginLocalPresenceWrite();
        manager.updateMyPresence({ cursor: 1 });
        manager.beginLocalPresenceWrite();
        manager.updateMyPresence({ cursor: 2 });
        manager.beginLocalPresenceWrite();
        manager.updateMyPresence({ cursor: 3 });

        expect(manager.ackOwnPresenceEcho()).toBe(false);
        expect(manager.ackOwnPresenceEcho()).toBe(false);
        expect(manager.ackOwnPresenceEcho()).toBe(true);

        const echo = manager.patchPresence({
            connectionId: "me",
            kind: "user",
            operator: null,
            presence: { cursor: 3 },
            seq: { presence: 54 },
            user: { id: "me" },
        });

        expect(echo).toEqual({ applied: true, presence: { cursor: 3 } });
        expect(manager.myself?.presence).toEqual({ cursor: 3 });
    });

    it("applies a later own echo after a sibling write overwrote local presence", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me-tab-1",
            data: { id: "me" },
            kind: "user",
            presence: { cursor: 1 },
            presenceSeq: 40,
        });
        manager.addConnection({
            connectionId: "me-tab-2",
            data: { id: "me" },
            kind: "user",
            presence: { cursor: 1 },
        });

        manager.beginLocalPresenceWrite();
        manager.updateMyPresence({ cursor: 2 });

        const sibling = manager.patchPresence({
            connectionId: "me-tab-2",
            kind: "user",
            operator: null,
            presence: { cursor: 9 },
            seq: { presence: 45 },
            user: { id: "me" },
        });

        expect(sibling).toEqual({ applied: true, presence: { cursor: 9 } });
        expect(manager.myself?.presence).toEqual({ cursor: 9 });
        expect(manager.ackOwnPresenceEcho()).toBe(true);

        const echo = manager.patchPresence({
            connectionId: "me-tab-1",
            kind: "user",
            operator: null,
            presence: { cursor: 2 },
            seq: { presence: 50 },
            user: { id: "me" },
        });

        expect(echo).toEqual({ applied: true, presence: { cursor: 2 } });
        expect(manager.myself?.presence).toEqual({ cursor: 2 });
    });

    it("keeps operators off occupant lists and looks both kinds up by user id", () => {
        const manager = createManager();
        const operator = {
            id: "staff-1",
            name: "Ada",
            imageUrl: null,
        };

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });
        manager.addConnection({
            connectionId: "ada-tab",
            data: { id: "ada" },
            kind: "user",
            presence: { name: "player" },
        });
        manager.addConnection({
            connectionId: "staff-tab",
            data: { id: "ada" },
            kind: "operator",
            operator,
            presence: { name: "staff" },
        });

        expect(manager.getOthers()).toEqual([
            {
                data: { id: "ada" },
                kind: "user",
                operator: null,
                presence: { name: "player" },
            },
        ]);
        expect(manager.getOthers({ kinds: ["operator"] })).toEqual([
            {
                data: { id: "ada" },
                kind: "operator",
                operator: { id: "staff-1", name: "Ada", imageUrl: null },
                presence: { name: "staff" },
            },
        ]);
        expect(manager.getOthers({ kinds: [] })).toEqual([]);
        expect(
            manager.getOthers({ kinds: ["user", "operator"] }).map((other) => other.kind),
        ).toEqual(["user", "operator"]);
        expect(manager.getOther("ada")).toEqual({
            data: { id: "ada" },
            kind: "user",
            operator: null,
            presence: { name: "player" },
        });
        expect(manager.getOther("ada", { kind: "operator" })).toEqual({
            data: { id: "ada" },
            kind: "operator",
            operator: { id: "staff-1", name: "Ada", imageUrl: null },
            presence: { name: "staff" },
        });
        expect(manager.getOther("staff-1", { kind: "operator" })).toBeNull();
        expect(manager.getOccupancy()).toEqual({ connectionCount: 2, userCount: 2 });
        expect(manager.getOccupancy({ kinds: ["operator"] })).toEqual({
            connectionCount: 1,
            userCount: 1,
        });
        expect(manager.getOccupancy({ kinds: ["user", "operator"] })).toEqual({
            connectionCount: 3,
            userCount: 3,
        });
        manager.addConnection({
            connectionId: "solo-staff",
            data: { id: "bea" },
            kind: "operator",
            operator: { id: "staff-2", name: "Bea", imageUrl: null },
            presence: { name: "solo" },
        });
        expect(manager.getOther("bea")).toBeNull();
        expect(manager.getOther("bea", { kind: "operator" })).toEqual({
            data: { id: "bea" },
            kind: "operator",
            operator: { id: "staff-2", name: "Bea", imageUrl: null },
            presence: { name: "solo" },
        });
    });

    it("reports a departed operator separately when their id matches a player", () => {
        const manager = createManager();
        const operator = {
            id: "staff-1",
            name: "Ada",
            imageUrl: null,
        };

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            kind: "user",
            presence: {},
        });
        manager.addConnection({
            connectionId: "player-tab",
            data: { id: "ada" },
            kind: "user",
            presence: { name: "player" },
        });
        manager.addConnection({
            connectionId: "staff-tab",
            data: { id: "ada" },
            kind: "operator",
            operator,
            presence: { name: "staff" },
        });

        const left = manager.replaceOthers([
            {
                connectionIds: ["player-tab"],
                data: { id: "ada" },
                kind: "user",
                presence: { name: "player" },
            },
        ]);

        expect(left).toEqual([{ id: "ada", kind: "operator" }]);
        expect(manager.getOther("ada")?.kind).toBe("user");
    });
});
