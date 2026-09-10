import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { describe, expect, it } from "vitest";
import type { Deferred } from "./__utils__";
import {
    deferred,
    encodedStateWithContent,
    isEmptyEncodedState,
    TestPlatform,
    TestSocket,
    tick,
    waitUntil,
} from "./__utils__";

const SEEDED_CONTENT = "content that must survive teardown";

/**
 * @description Hydrates the room from `getInitialStorage`, as happens after a Durable Object
 * hibernates. The first `onStorageDestroyed` blocks on a gate so a test can hold a teardown
 * open and interleave against it.
 */
const setupRoom = (roomId: string) => {
    const seeded = encodedStateWithContent(SEEDED_CONTENT);
    const destroyed: (string | null)[] = [];
    const gate: Deferred<void> = deferred();

    let shouldBlock = true;

    const io = createIO({ crdt: yjs, platform: () => new TestPlatform() });
    const server = io.server({
        getInitialStorage: () => Promise.resolve(seeded),
        onStorageDestroyed: async ({ encodedState }) => {
            destroyed.push(encodedState);

            if (!shouldBlock) return;

            shouldBlock = false;

            await gate.promise;
        },
    });

    return { destroyed, gate, room: server.createRoom(roomId), seeded };
};

describe("IORoom teardown", () => {
    it("persists storage once, and never persists an empty document", async () => {
        const { destroyed, gate, room } = setupRoom("overlapping-teardowns");

        await room.register(new TestSocket("session-1"));

        // Held open inside its onStorageDestroyed webhook.
        const firstTeardown = room.evictAll();

        await waitUntil(() => destroyed.length >= 1);

        const secondTeardown = room.evictAll();

        await tick(3);

        gate.resolve();

        await Promise.all([firstTeardown, secondTeardown]);

        expect(destroyed.filter((state) => isEmptyEncodedState(state))).toEqual([]);
        expect(destroyed).toHaveLength(1);
    });

    it("does not hand a late connection an empty document while teardown is in-flight", async () => {
        const { destroyed, gate, room } = setupRoom("register-during-teardown");

        await room.register(new TestSocket("session-1"));

        const teardown = room.evictAll();

        await waitUntil(() => destroyed.length >= 1);

        // The room is mid-teardown, so its doc has already been cleared.
        const late = new TestSocket("session-2");
        const registration = room.register(late);

        await tick(2);

        gate.resolve();

        await Promise.all([teardown, registration]);

        const registered = late.messages.find((message) => message.type === "$registered");

        expect(registered).toBeDefined();
        expect(isEmptyEncodedState(registered?.data?.state ?? null)).toBe(false);
    });
});
