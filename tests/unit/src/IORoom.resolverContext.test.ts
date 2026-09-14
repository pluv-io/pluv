import { describe, expect, it } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket } from "./__utils__";

type Room = {
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
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

describe("IORoom EventResolverContext", () => {
    it("keeps storageSeeded live and writes presence through setPresence", async () => {
        let readBack: { presence: unknown; seededAfter: boolean } | null = null;

        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const server = io.server({
            router: io.router({
                stamp: io.procedure.broadcast((_data, ctx) => {
                    const seededBefore = ctx.storageSeeded;

                    ctx.storageSeeded = true;
                    const seededAfter = ctx.storageSeeded;
                    ctx.storageSeeded = seededBefore;

                    ctx.presence = { ...ctx.presence, mark: 1 };
                    readBack = {
                        presence: ctx.presence,
                        seededAfter,
                    };

                    return {};
                }),
            }),
        });
        const room = server.createRoom("resolver-context");
        const first = new TestSocket("session-1");
        const observer = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await send(room, first, "$initializeSession", {
            presence: { name: "ada" },
            update: null,
        });

        await registerAuthorized(room, observer, { io });
        await send(room, observer, "$initializeSession", {
            presence: { name: "bob" },
            update: null,
        });

        await send(room, first, "stamp", {});
        await send(room, observer, "$getOthers", {});

        expect(readBack).toEqual({
            presence: { name: "ada" },
            seededAfter: true,
        });
        expect(lastMessage(observer, "$othersReceived").data.others["session-1"].presence).toEqual({
            name: "ada",
            mark: 1,
        });
    });
});
