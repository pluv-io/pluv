import { __internal } from "@pluv/io";
import { describe, expect, it, vi } from "vitest";

describe("createBaseRouter", () => {
    it("registers the built-in $ protocol events", () => {
        const router = __internal.createBaseRouter({
            limits: {},
            onStorageUpdated: vi.fn(),
        });

        expect(Object.keys(router._defs.events).sort()).toEqual(
            [
                "$getOthers",
                "$initializeSession",
                "$ping",
                "$updatePresence",
                "$updateStorage",
            ].sort(),
        );
    });
});
