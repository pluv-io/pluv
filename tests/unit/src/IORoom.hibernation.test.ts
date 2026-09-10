import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { applyUpdate, Doc as YDoc, encodeStateAsUpdate, encodeStateVector } from "yjs";
import { describe, expect, it, vi } from "vitest";
import { encodedStateWithContent, TestPersistence, TestPlatform, TestSocket } from "./__utils__";

describe("IORoom hibernation", () => {
    it("does not evict a hibernated socket with a recent auto-response ping", async () => {
        const roomId = "hibernated-heartbeat";
        const socket = new TestSocket("session-1");
        const persistence = new TestPersistence();
        const onStorageDestroyed = vi.fn();
        const now = Date.now();

        await persistence.setStorageState(roomId, encodedStateWithContent("current"));

        const io = createIO({
            crdt: yjs,
            platform: () =>
                new TestPlatform({
                    hibernatedWebSockets: [socket],
                    lastPings: new Map([[socket, now]]),
                    mode: "detached",
                    persistence,
                    serializedStates: new Map([
                        [
                            socket,
                            {
                                presence: null,
                                quit: false,
                                room: roomId,
                                timers: {
                                    ping: now - 60_000,
                                    presence: null,
                                },
                            },
                        ],
                    ]),
                }),
        });
        const server = io.server({
            getInitialStorage: () => Promise.resolve(null),
            onStorageDestroyed,
        });
        const room = server.createRoom(roomId);

        expect(room.getSize()).toBe(1);

        await room.garbageCollect();

        expect(room.getSize()).toBe(1);
        expect(onStorageDestroyed).not.toHaveBeenCalled();

        const stored = await persistence.getStorageState(roomId);
        const clientDoc = new YDoc();

        applyUpdate(clientDoc, Buffer.from(stored!, "base64"));

        const stateVector = encodeStateVector(clientDoc);
        const content = clientDoc.getText("content");

        content.insert(content.length, " latest");

        await room.onMessage(socket)({
            data: JSON.stringify({
                type: "$updateStorage",
                data: {
                    origin: null,
                    update: Buffer.from(encodeStateAsUpdate(clientDoc, stateVector)).toString(
                        "base64",
                    ),
                },
            }),
        });

        const updated = new YDoc();
        const updatedState = await persistence.getStorageState(roomId);

        applyUpdate(updated, Buffer.from(updatedState!, "base64"));

        expect(updated.getText("content").toJSON()).toBe("current latest");
    });
});
