import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { api } from "./api";

const output = z.object({ id: z.string().min(1) });
const input = z.object({ name: z.string().min(1) });
const base = "https://api.pluv.io";

afterEach(() => {
    delete process.env.PLUV_SESSION_TOKEN;
    vi.unstubAllGlobals();
});

describe("api", () => {
    it("sends a bearer token and a parsed json body", async () => {
        let authorization: string | null = null;
        let contentType: string | null = null;
        let method = "";
        let body = "";

        vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
            const headers = new Headers(init?.headers);

            method = init?.method ?? "";
            authorization = headers.get("authorization");
            contentType = headers.get("content-type");
            body = String(init?.body);

            return Response.json({ id: "deployment" });
        });

        await expect(
            api
                .base(base)
                .bearer("session-token")
                .post("/api/example")
                .bearer("jwt-token")
                .body(input, { name: "room" })
                .output(output)
                .error("Request failed.")
                .send(),
        ).resolves.toEqual({ id: "deployment" });
        expect(method).toBe("POST");
        expect(authorization).toBe("Bearer jwt-token");
        expect(contentType).toBe("application/json");
        expect(body).toBe(JSON.stringify({ name: "room" }));
    });

    it("merges search params and lets headers overwrite the json content type", async () => {
        let url = "";
        let contentType: string | null = null;

        vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
            url = String(input);
            contentType = new Headers(init?.headers).get("content-type");

            return Response.json({ id: "deployment" });
        });

        await api
            .base(base)
            .post("/api/example")
            .searchParams({ room: "one", limit: 10 })
            .searchParams({ room: "two", cursor: undefined })
            .body(input, { name: "room" })
            .headers({ "content-type": "text/javascript" })
            .output(output)
            .send();

        expect(url).toBe("https://api.pluv.io/api/example?room=two&limit=10");
        expect(contentType).toBe("text/javascript");
    });

    it("uses the error function for a failed response and the invalid string for a bad body", async () => {
        vi.stubGlobal("fetch", async () =>
            Response.json({ message: "disk full" }, { status: 500 }),
        );

        await expect(
            api
                .base(base)
                .post("/api/example")
                .output(output)
                .error(
                    (status, body) => `${status} ${String((body as { message?: string }).message)}`,
                )
                .invalid("Could not start the deployment.")
                .send(),
        ).rejects.toThrow("500 disk full");

        vi.stubGlobal("fetch", async () => Response.json({ message: "ignored" }));

        await expect(
            api
                .base(base)
                .get("/api/example")
                .output(output)
                .error(() => "from the status")
                .invalid("Could not start the deployment.")
                .send(),
        ).rejects.toThrow("Could not start the deployment.");
    });

    it("accepts only the expected status", async () => {
        vi.stubGlobal("fetch", async () => new Response(null, { status: 204 }));

        await expect(
            api
                .base(base)
                .bearer("session-token")
                .post("/api/example")
                .expect(204)
                .error("Could not delete the session.")
                .send(),
        ).resolves.toBeUndefined();

        vi.stubGlobal("fetch", async () => new Response(null, { status: 500 }));

        await expect(
            api
                .base(base)
                .post("/api/example")
                .expect(204)
                .error("Could not delete the session.")
                .send(),
        ).rejects.toThrow("Could not delete the session.");
    });

    it("exchanges the saved session for a jwt before the request", async () => {
        process.env.PLUV_SESSION_TOKEN = "session-token";
        const authorizations: Array<string | null> = [];

        vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            authorizations.push(new Headers(init?.headers).get("authorization"));

            if (url.endsWith("/api/auth/session/jwt")) return Response.json({ jwt: "jwt-token" });

            return Response.json({ id: "deployment" });
        });

        await expect(
            api.client({ cwd: "/tmp" }).post("/api/example").output(output).send(),
        ).resolves.toEqual({ id: "deployment" });
        expect(authorizations).toEqual(["Bearer session-token", "Bearer jwt-token"]);
    });

    it("omits authorization when no session is saved", async () => {
        let authorization: string | null = "unset";

        vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
            authorization = new Headers(init?.headers).get("authorization");

            return new Response(null, { status: 204 });
        });

        await api.client({ cwd: "/tmp" }).post("/api/auth/cli/token").expect(204).send();
        expect(authorization).toBeNull();
    });

    it("rejects a second output or body", () => {
        const request = api
            .base(base)
            .post("/api/example")
            .body(input, { name: "room" })
            .output(output);

        expect(() => request.output(output)).toThrow("Output was already defined");
        expect(() => request.body(input, { name: "again" })).toThrow("Body was already defined");
    });
});
