import { describe, expect, it } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket } from "./__utils__";

type Room = {
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket) => Promise<void>;
};

const lastMessage = (socket: TestSocket, type: string): { type: string; data: any } => {
    const message = [...socket.messages].reverse().find((entry) => entry.type === type);

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
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const server = io.server({
            router: io.router({
                boom: io.procedure.broadcast(() => {
                    throw new Error("procedure exploded");
                }),
            }),
        });
        const room = server.createRoom("procedure-throw");
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await send(room, socket, "boom", {});

        expect(lastMessage(socket, "$error").data.message).toBe("procedure exploded");
    });

    it("sends $error when presence exceeds the size limit", async () => {
        const io = createAuthorizedIO({
            limits: { presenceMaxSize: 32 },
            platform: { mode: "detached" },
        });
        const server = io.server();
        const room = server.createRoom("presence-limit");
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await send(room, socket, "$initializeSession", { presence: {}, update: null });
        await send(room, socket, "$updatePresence", {
            presence: { note: "x".repeat(64) },
        });

        expect(lastMessage(socket, "$error").data.message).toMatch(/Presence must be at most/);
    });

    it("still sends $error for invalid procedure input", async () => {
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
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
        const room = server.createRoom("invalid-input");
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await send(room, socket, "echo", { message: 1 });

        expect(lastMessage(socket, "$error").data.message).toBe("Expected { message: string }");
    });
});
