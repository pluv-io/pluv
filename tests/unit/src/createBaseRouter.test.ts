import { __internal } from "@pluv/io";
import type { BaseClientEventRecord } from "@pluv/types";
import { describe, expect, it, vi } from "vitest";

const BASE_CLIENT_EVENT_KEYS = Object.keys({
    $getOthers: true,
    $initializeSession: true,
    $listUsers: true,
    $ping: true,
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
});
