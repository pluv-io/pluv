import { isUserTurn } from "@pluv/io";
import { describe, expect, it } from "vitest";

describe("isUserTurn", () => {
    it("reads a non-enumerable thenable", () => {
        const turn = Object.defineProperty({}, "$u", {
            value: Promise.resolve(null),
        });

        expect(isUserTurn(turn)).toBe(true);
    });

    it("leaves a presence patch that contains $u", () => {
        expect(isUserTurn({ $u: "kept" })).toBe(false);
        expect(isUserTurn({ $u: Promise.resolve("kept") })).toBe(false);
    });
});
