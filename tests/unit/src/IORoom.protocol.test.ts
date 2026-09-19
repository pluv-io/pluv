import { describe, expect, it } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket } from "./__utils__";

const lastMessage = (socket: TestSocket, type: string): Record<string, any> => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

describe("IORoom protocol relay", () => {
    it("drops unknown $ events instead of relaying them", async () => {
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const room = io.server().createRoom("protocol-relay");
        const sender = new TestSocket("session-1");
        const observer = new TestSocket("session-2");

        await registerAuthorized(room, sender, { io, user: { id: "ada" } });
        await registerAuthorized(room, observer, { io, user: { id: "bob" } });

        await room.onMessage(sender)({
            data: JSON.stringify({
                type: "$roomStats",
                data: { connectionCount: 999, userCount: 999 },
            }),
        });
        await room.onMessage(sender)({
            data: JSON.stringify({
                type: "$notARealProtocol",
                data: { spoofed: true },
            }),
        });
        await room.onMessage(sender)({
            data: JSON.stringify({
                type: "shout",
                data: { text: "hello" },
            }),
        });

        expect(
            observer.messages.some(
                (message) =>
                    message.type === "$roomStats" &&
                    message.data?.connectionCount === 999 &&
                    message.data?.userCount === 999,
            ),
        ).toBe(false);
        expect(observer.messages.some((message) => message.type === "$notARealProtocol")).toBe(
            false,
        );
        expect(lastMessage(observer, "shout").data).toEqual({ text: "hello" });
    });
});
