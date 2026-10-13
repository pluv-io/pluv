import { manageSessions } from "@pluv/io";
import { describe, expect, it } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket, tick, waitUntil } from "./__utils__";

type Room = {
    id: string;
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket, ...options: any[]) => Promise<void>;
};

const lastMessage = (socket: TestSocket, type: string): { type: string; data: any } => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const send = async (room: Room, socket: TestSocket, type: string, data: unknown): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({ type, data }),
    });
};

describe("IORoom procedure errors", () => {
    it("sends $error when a procedure resolver throws", async () => {
        const io = createAuthorizedIO({});
        const server = io.server({
            router: io.router({
                boom: io.procedure.broadcast(() => {
                    throw new Error("procedure exploded");
                }),
            }),
        });
        const room = manageSessions(server.createRoom("procedure-throw"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await send(room, socket, "boom", {});

        expect(lastMessage(socket, "$error").data.message).toBe("procedure exploded");
    });

    it("does not start broadcast when self throws", async () => {
        const io = createAuthorizedIO({});
        let room!: Room & {
            evict: (sessionId: string) => Promise<void>;
            getSize: () => number;
        };
        const server = io.server({
            router: io.router({
                kick: io.procedure
                    .broadcast(async () => {
                        await room.evict("session-2");

                        return {};
                    })
                    .self(() => {
                        throw new Error("self exploded");
                    }),
            }),
        });

        room = manageSessions(server.createRoom("self-throw-before-broadcast"));

        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, second, { io });
        await send(room, first, "kick", {});
        await tick();

        expect(lastMessage(first, "$error").data.message).toBe("self exploded");
        expect(room.getSize()).toBe(2);
    });

    it("still runs a started self promise when broadcast throws", async () => {
        const io = createAuthorizedIO({});
        let room!: Room & {
            evict: (sessionId: string) => Promise<void>;
            getSize: () => number;
        };
        const server = io.server({
            router: io.router({
                kick: io.procedure
                    .self(async () => {
                        await room.evict("session-2");

                        return {};
                    })
                    .broadcast(() => {
                        throw new Error("broadcast exploded");
                    }),
            }),
        });

        room = manageSessions(server.createRoom("broadcast-throw-after-self"));

        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, second, { io });
        await send(room, first, "kick", {});
        await waitUntil(() => room.getSize() === 1);

        expect(lastMessage(first, "$error").data.message).toBe("broadcast exploded");
        expect(room.getSize()).toBe(1);
    });

    it("sends $error when presence exceeds the size limit", async () => {
        const io = createAuthorizedIO({
            limits: { presenceMaxSize: 32 },
        });
        const server = io.server();
        const room = manageSessions(server.createRoom("presence-limit"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await send(room, socket, "$initializeSession", { presence: {}, update: null });
        await send(room, socket, "$updatePresence", {
            presence: { note: "x".repeat(64) },
        });

        expect(lastMessage(socket, "$error").data.message).toMatch(/Presence must be at most/);
    });

    it("still sends $error for invalid procedure input", async () => {
        const io = createAuthorizedIO({});
        const server = io.server({
            router: io.router({
                echo: io.procedure
                    .input({
                        "~standard": {
                            version: 1,
                            vendor: "test",
                            validate: (data: unknown) => {
                                if (
                                    typeof data !== "object" ||
                                    data === null ||
                                    typeof (data as { message?: unknown }).message !== "string"
                                ) {
                                    return {
                                        issues: [{ message: "Expected { message: string }" }],
                                    };
                                }

                                return { value: data as { message: string } };
                            },
                        },
                    })
                    .broadcast(({ message }) => ({ echoed: { message } })),
            }),
        });
        const room = manageSessions(server.createRoom("invalid-input"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await send(room, socket, "echo", { message: 1 });

        expect(lastMessage(socket, "$error").data.message).toBe("Expected { message: string }");
    });
});
