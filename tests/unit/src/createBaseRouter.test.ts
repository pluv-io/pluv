import { __internal } from "@pluv/io";
import type { BaseClientEventRecord } from "@pluv/types";
import { describe, expect, it, vi } from "vitest";

const BASE_CLIENT_EVENT_KEYS = Object.keys({
    $getOthers: true,
    $initializeSession: true,
    $listUsers: true,
    $ping: true,
    $syncStorage: true,
    $updatePresence: true,
    $updateStorage: true,
} satisfies Record<keyof BaseClientEventRecord, true>);

describe("createBaseRouter", () => {
    it("registers the built-in $ protocol events", () => {
        const router = __internal.createBaseRouter({
            limits: {},
            onStorageUpdated: vi.fn(),
        });

        expect(Object.keys(router._defs.events).toSorted()).toEqual(
            [
                "$getOthers",
                "$initializeSession",
                "$listUsers",
                "$ping",
                "$syncStorage",
                "$updatePresence",
                "$updateStorage",
            ].toSorted(),
        );
    });

    it("covers every BaseClientEventRecord key", () => {
        const router = __internal.createBaseRouter({
            limits: {},
            onStorageUpdated: vi.fn(),
        });

        expect(Object.keys(router._defs.events)).toEqual(
            expect.arrayContaining(BASE_CLIENT_EVENT_KEYS),
        );
    });

    it("keeps broadcast and self on the procedures that already had them", () => {
        const router = __internal.createBaseRouter({
            limits: {},
            onStorageUpdated: vi.fn(),
        });
        const events = router._defs.events as Record<
            string,
            { config: { broadcast: unknown; self: unknown } }
        >;
        const shape = (name: string) => ({
            broadcast: typeof events[name]?.config.broadcast === "function",
            self: typeof events[name]?.config.self === "function",
        });

        expect(shape("$initializeSession")).toEqual({ broadcast: true, self: true });

        for (const name of ["$updatePresence", "$updateStorage"]) {
            expect(shape(name)).toEqual({ broadcast: true, self: false });
        }

        for (const name of ["$ping", "$getOthers", "$listUsers", "$syncStorage"]) {
            expect(shape(name)).toEqual({ broadcast: false, self: true });
        }
    });
});
