import { __internal, DEFAULT_MAX_CONNECTIONS } from "@pluv/io";
import { describe, expect, it } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket } from "./__utils__";

describe("presence fan-out seatbelt", () => {
    it("accepts the default maxConnections", () => {
        expect(() => {
            createAuthorizedIO();
        }).not.toThrow();
    });

    it("throws when maxConnections is too high without the override", () => {
        expect(() => {
            createAuthorizedIO({
                limits: { maxConnections: 512 },
            });
        }).toThrow(/maxConnections \(512\) is too high/);
    });

    it("allows a high cap with dangerouslyAllowHighPresenceFanout", () => {
        expect(() => {
            createAuthorizedIO({
                limits: {
                    dangerouslyAllowHighPresenceFanout: true,
                    maxConnections: 1_000,
                },
            });
        }).not.toThrow();
    });

    it("rejects a non-positive or non-integer maxConnections", () => {
        expect(() => {
            createAuthorizedIO({ limits: { maxConnections: 0 } });
        }).toThrow(/positive integer/);
        expect(() => {
            createAuthorizedIO({ limits: { maxConnections: -1 } });
        }).toThrow(/positive integer/);
        expect(() => {
            createAuthorizedIO({ limits: { maxConnections: 1.5 } });
        }).toThrow(/positive integer/);
    });

    it("rejects extra sockets at maxConnections", async () => {
        const io = createAuthorizedIO({
            limits: { maxConnections: 2 },
            platform: { mode: "detached" },
        });
        const room = io.server().createRoom("max-connections");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const third = new TestSocket("session-3");

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, second, { io });
        await registerAuthorized(room, third, { io });

        expect(room.getSize()).toBe(2);
        expect(third.readyState).toBe(3);
        expect(third.messages.find((message) => message.type === "$error")?.data.message).toMatch(
            /maxConnections/,
        );
    });

    it("rejects a concurrent extra socket at maxConnections", async () => {
        const io = createAuthorizedIO({
            limits: { maxConnections: 1 },
            platform: { mode: "detached" },
        });
        const room = io.server().createRoom("max-connections-race");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await Promise.all([
            registerAuthorized(room, first, { io, user: { id: "ada" } }),
            registerAuthorized(room, second, { io, user: { id: "bob" } }),
        ]);

        expect(room.getSize()).toBe(1);
        expect([first, second].filter((socket) => socket.readyState === 3)).toHaveLength(1);
    });

    it("exposes resolveMaxConnections defaults", () => {
        expect(__internal.resolveMaxConnections({})).toBe(DEFAULT_MAX_CONNECTIONS);
        expect(__internal.resolveMaxConnections({ maxConnections: null })).toBe(
            DEFAULT_MAX_CONNECTIONS,
        );
        expect(__internal.resolveMaxConnections({ maxConnections: 10 })).toBe(10);
    });
});
