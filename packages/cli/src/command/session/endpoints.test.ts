import { afterEach, describe, expect, it } from "vitest";
import { apiBase } from "./endpoints";

const key = "PLUV_API_URL";

afterEach(() => {
    delete process.env[key];
});

describe("apiBase", () => {
    it("uses the config url when the env var is unset", () => {
        expect(apiBase({ apiUrl: "http://localhost:8880" })).toBe("http://localhost:8880");
    });

    it("lets the env var win", () => {
        process.env[key] = "http://127.0.0.1:9";

        expect(apiBase({ apiUrl: "http://localhost:8880" })).toBe("http://127.0.0.1:9");
    });

    it("uses production when neither is set", () => {
        expect(apiBase()).toBe("https://api.pluv.io");
    });
});
