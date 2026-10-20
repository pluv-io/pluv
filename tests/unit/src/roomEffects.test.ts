import { isDeferredResult } from "@pluv/io";
import { describe, expect, it } from "vitest";

describe("isDeferredResult", () => {
    it("reads a non-enumerable thenable", () => {
        const result = Object.defineProperty({}, "$u", {
            value: Promise.resolve(null),
        });

        expect(isDeferredResult(result)).toBe(true);
    });

    it("leaves a presence patch that contains $u", () => {
        expect(isDeferredResult({ $u: "kept" })).toBe(false);
        expect(isDeferredResult({ $u: Promise.resolve("kept") })).toBe(false);
    });
});
