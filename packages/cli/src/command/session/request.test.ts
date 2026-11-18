import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { requestJson, requestStatus } from "./request";

const schema = z.object({ id: z.string().min(1) });
const url = new URL("https://api.pluv.io/api/example");

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("requestJson", () => {
    it("sends a bearer token and a json body", async () => {
        let authorization: string | null = null;
        let contentType: string | null = null;
        let body = "";

        vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
            const headers = new Headers(init?.headers);

            authorization = headers.get("authorization");
            contentType = headers.get("content-type");
            body = String(init?.body);

            return Response.json({ id: "deployment" });
        });

        await expect(
            requestJson({
                url,
                method: "POST",
                token: "jwt-token",
                json: { name: "room" },
                schema,
                error: "Request failed.",
            }),
        ).resolves.toEqual({ id: "deployment" });
        expect(authorization).toBe("Bearer jwt-token");
        expect(contentType).toBe("application/json");
        expect(body).toBe(JSON.stringify({ name: "room" }));
    });

    it("uses the error function for a failed response and the invalid string for a bad body", async () => {
        vi.stubGlobal("fetch", async () =>
            Response.json({ message: "disk full" }, { status: 500 }),
        );

        await expect(
            requestJson({
                url,
                method: "POST",
                schema,
                error: (status, body) =>
                    `${status} ${String((body as { message?: string }).message)}`,
                invalid: "Could not start the deployment.",
            }),
        ).rejects.toThrow("500 disk full");

        vi.stubGlobal("fetch", async () => Response.json({ message: "ignored" }));

        await expect(
            requestJson({
                url,
                schema,
                error: () => "from the status",
                invalid: "Could not start the deployment.",
            }),
        ).rejects.toThrow("Could not start the deployment.");
    });
});

describe("requestStatus", () => {
    it("accepts the expected status and ignores the body", async () => {
        vi.stubGlobal("fetch", async () => new Response(null, { status: 204 }));

        await expect(
            requestStatus({
                url,
                method: "POST",
                token: "session-token",
                expect: 204,
                error: "Could not delete the session.",
            }),
        ).resolves.toBeUndefined();
    });

    it("throws when the status does not match", async () => {
        vi.stubGlobal("fetch", async () => new Response(null, { status: 500 }));

        await expect(
            requestStatus({
                url,
                method: "POST",
                expect: 204,
                error: "Could not delete the session.",
            }),
        ).rejects.toThrow("Could not delete the session.");
    });
});
