import { yjs } from "@pluv/crdt-yjs";
import { describe, expect, it } from "vitest";
import {
    createAuthorizedIO,
    deferred,
    registerAuthorized,
    TestSocket,
    tick,
} from "./__utils__";

describe("IORoom initialization", () => {
    it("waits for getInitialStorage before finishing register", async () => {
        const webhook = deferred<string | null>();
        let storageReads = 0;
        const io = createAuthorizedIO({
            crdt: yjs,
            platform: { mode: "detached" },
        });
        const server = io.server({
            getInitialStorage: async () => {
                storageReads += 1;

                return webhook.promise;
            },
        });
        const room = server.createRoom("init-wait");
        const socket = new TestSocket("session-1");

        const registration = registerAuthorized(room, socket, { io });

        await tick();
        expect(storageReads).toBe(1);
        expect(socket.messages.some((message) => message.type === "$registered")).toBe(false);

        webhook.resolve(null);
        await registration;

        expect(socket.messages.some((message) => message.type === "$registered")).toBe(true);
    });
});
