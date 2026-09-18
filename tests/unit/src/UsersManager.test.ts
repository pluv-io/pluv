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
            presence: { name: "ada" },
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            presence: { cursor: 1, name: "bob" },
        });
        manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            presence: { cursor: 9, name: "bob" },
        });

        const other = manager.getOther("bob");

        expect(other).toEqual({
            data: { id: "bob" },
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
            presence: { name: "ada" },
        });
        manager.addConnection({
            connectionId: "old",
            data: { id: "old" },
            presence: { name: "old" },
        });

        const left = manager.replaceOthers([
            {
                connectionIds: ["bob-tab-1", "bob-tab-2"],
                data: { id: "bob" },
                presence: { cursor: 2 },
            },
        ]);
        manager.setMyConnectionIds(["ada-tab-1", "ada-tab-2"]);

        expect(left).toEqual(["old"]);
        expect(manager.getOthers().map((other) => other.data)).toEqual([{ id: "bob" }]);
        expect(manager.getOtherByConnectionId("bob-tab-2")?.data).toEqual({ id: "bob" });
        expect(manager.getOtherByConnectionId("ada-tab-2")).toBeNull();
        expect(manager.myself).toEqual({
            data: { id: "ada" },
            presence: { name: "ada" },
        });
        expect(manager.myself).not.toHaveProperty("connectionIds");
    });

    it("keeps extra-tab addConnection from replacing presence until a write", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            presence: {},
        });

        const first = manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            presence: { cursor: 1, name: "bob" },
        });
        const second = manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            presence: { cursor: 9, name: "other-tab" },
        });

        expect(first.remaining).toBe(1);
        expect(first.presenceChanged).toBe(true);
        expect(second.remaining).toBe(2);
        expect(second.presenceChanged).toBe(false);
        expect(second.data).toEqual({
            data: { id: "bob" },
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

    it("applies extra-tab presence only when the timer is newer", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            presence: {},
        });

        const first = manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            presence: { cursor: 1 },
            presenceTimer: 10,
        });
        const stale = manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            presence: { cursor: 9 },
            presenceTimer: 9,
        });
        const newer = manager.addConnection({
            connectionId: "bob-tab-3",
            data: { id: "bob" },
            presence: { cursor: 3 },
            presenceTimer: 11,
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
            presence: {},
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            presence: { cursor: 1 },
            presenceTimer: 10,
        });

        const stale = manager.patchPresence("bob-tab-1", { cursor: 9 }, 9);
        const newer = manager.patchPresence("bob-tab-1", { cursor: 3 }, 11);

        expect(stale).toEqual({ applied: false, presence: { cursor: 1 } });
        expect(newer).toEqual({ applied: true, presence: { cursor: 3 } });
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 3 });
    });

    it("keeps last-write-wins timers when replacing others from a snapshot", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            presence: {},
        });
        manager.replaceOthers([
            {
                connectionIds: ["bob-tab-1"],
                data: { id: "bob" },
                presence: { cursor: 2 },
                presenceTimer: 20,
            },
        ]);

        const stale = manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            presence: { cursor: 1 },
            presenceTimer: 10,
        });

        expect(stale.presenceChanged).toBe(false);
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 2 });
    });

    it("keeps a newer local presence when a snapshot is older", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            presence: {},
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            presence: { cursor: 3 },
            presenceTimer: 20,
        });

        const left = manager.replaceOthers([
            {
                connectionIds: ["bob-tab-1", "bob-tab-2"],
                data: { id: "bob" },
                presence: { cursor: 1 },
                presenceTimer: 10,
            },
        ]);

        expect(left).toEqual([]);
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 3 });
        expect(manager.getOtherByConnectionId("bob-tab-2")?.presence).toEqual({ cursor: 3 });
    });

    it("applies an equal-timer presence patch as last-write-wins", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            presence: {},
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            presence: { cursor: 1 },
            presenceTimer: 10,
        });

        const equal = manager.patchPresence("bob-tab-1", { cursor: 9 }, 10);

        expect(equal).toEqual({ applied: true, presence: { cursor: 9 } });
        expect(manager.getOther("bob")?.presence).toEqual({ cursor: 9 });
    });

    it("does not stamp client wall-clock on a local presence write", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "ada-tab-1",
            data: { id: "ada" },
            presence: {},
            presenceTimer: 10,
        });
        manager.updateMyPresence({ cursor: 1 });

        const sibling = manager.patchPresence("ada-tab-1", { cursor: 2 }, 11);

        expect(sibling).toEqual({ applied: true, presence: { cursor: 2 } });
        expect(manager.myself?.presence).toEqual({ cursor: 2 });
    });

    it("prunes only people whose last connection dropped", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me",
            data: { id: "me" },
            presence: {},
        });
        manager.addConnection({
            connectionId: "bob-tab-1",
            data: { id: "bob" },
            presence: { name: "bob" },
        });
        manager.addConnection({
            connectionId: "bob-tab-2",
            data: { id: "bob" },
            presence: { name: "bob" },
        });
        manager.addConnection({
            connectionId: "cara-tab-1",
            data: { id: "cara" },
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
            presence: { cursor: 0 },
            presenceTimer: 40,
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

        const echo = manager.patchPresence("me", { cursor: 3 }, 54);

        expect(echo).toEqual({ applied: true, presence: { cursor: 3 } });
        expect(manager.myself?.presence).toEqual({ cursor: 3 });
    });

    it("applies a later own echo after a sibling write overwrote local presence", () => {
        const manager = createManager();

        manager.setMyself({
            connectionId: "me-tab-1",
            data: { id: "me" },
            presence: { cursor: 1 },
            presenceTimer: 40,
        });
        manager.addConnection({
            connectionId: "me-tab-2",
            data: { id: "me" },
            presence: { cursor: 1 },
        });

        manager.beginLocalPresenceWrite();
        manager.updateMyPresence({ cursor: 2 });

        const sibling = manager.patchPresence("me-tab-2", { cursor: 9 }, 45);

        expect(sibling).toEqual({ applied: true, presence: { cursor: 9 } });
        expect(manager.myself?.presence).toEqual({ cursor: 9 });
        expect(manager.ackOwnPresenceEcho()).toBe(true);

        const echo = manager.patchPresence("me-tab-1", { cursor: 2 }, 50);

        expect(echo).toEqual({ applied: true, presence: { cursor: 2 } });
        expect(manager.myself?.presence).toEqual({ cursor: 2 });
    });
});
