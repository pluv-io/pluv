import { __internal, PluvRouter } from "@pluv/io";
import { describe, expect, it } from "vitest";
import { createAuthorizedIO } from "./__utils__";

describe("PluvRouter event names and merge", () => {
    it("rejects $ event names on the public constructor and io.router", () => {
        const io = createAuthorizedIO({ platform: { mode: "detached" } });
        const procedure = io.procedure.broadcast(() => ({ ok: {} }));

        expect(() => new PluvRouter({ $secret: procedure } as any)).toThrow(/must not contain \$/);
        expect(() => io.router({ $secret: procedure } as any)).toThrow(/must not contain \$/);
    });

    it("rejects non-identifier event names", () => {
        const io = createAuthorizedIO({ platform: { mode: "detached" } });
        const procedure = io.procedure.broadcast(() => ({ ok: {} }));

        expect(() => new PluvRouter({ "not-valid": procedure } as any)).toThrow(
            /valid JavaScript variable names/,
        );
    });

    it("allows $ protocol events via __internal.createInternalPluvRouter", () => {
        const io = createAuthorizedIO({ platform: { mode: "detached" } });
        const procedure = io.procedure.self(() => ({ $pong: {} }));

        expect(() =>
            __internal.createInternalPluvRouter({ $ping: procedure } as any),
        ).not.toThrow();
    });

    it("throws when merging routers with duplicate event names", () => {
        const io = createAuthorizedIO({ platform: { mode: "detached" } });
        const procedure = io.procedure.broadcast(() => ({ ok: {} }));
        const left = io.router({ echo: procedure });
        const right = io.router({ echo: procedure });

        expect(() => PluvRouter.merge(left, right)).toThrow(/Duplicate event name "echo"/);
    });

    it("merges an internal base router with a user router when keys do not overlap", () => {
        const io = createAuthorizedIO({ platform: { mode: "detached" } });
        const ping = io.procedure.self(() => ({ $pong: {} }));
        const echo = io.procedure.broadcast(() => ({ ok: {} }));
        const base = __internal.createInternalPluvRouter({ $ping: ping } as any);
        const user = io.router({ echo });

        const merged = PluvRouter.merge(base, user);

        expect(Object.keys(merged._defs.events).toSorted()).toEqual(["$ping", "echo"].toSorted());
    });

    it("exposes built-in $ events on the server after createRoom", () => {
        const io = createAuthorizedIO({ platform: { mode: "detached" } });
        const server = io.server();
        const room = server.createRoom("router-builtins");

        expect(Object.keys(room._defs.events)).toEqual(
            expect.arrayContaining([
                "$getOthers",
                "$initializeSession",
                "$ping",
                "$updatePresence",
                "$updateStorage",
            ]),
        );
    });
});
