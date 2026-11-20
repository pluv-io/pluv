import { afterEach, describe, expect, it } from "vitest";
import { resolvePluvConfigInternal } from "../../src/config/resolvePluvConfigInternal";
import { defaultPluvConfigInternal } from "../../src/schemas";

const key = "PLUV_API_URL";

afterEach(() => {
    delete process.env[key];
});

describe("resolvePluvConfigInternal", () => {
    it("uses the config url when the env var is unset", () => {
        expect(resolvePluvConfigInternal({ apiUrl: "http://localhost:8880" }).apiUrl).toBe(
            "http://localhost:8880",
        );
    });

    it("lets the env var win", () => {
        process.env[key] = "http://127.0.0.1:9";

        expect(resolvePluvConfigInternal({ apiUrl: "http://localhost:8880" }).apiUrl).toBe(
            "http://127.0.0.1:9",
        );
    });

    it("uses production when neither is set", () => {
        expect(resolvePluvConfigInternal()).toEqual(defaultPluvConfigInternal);
    });
});
