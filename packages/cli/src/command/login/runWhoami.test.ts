import { afterEach, describe, expect, it, vi } from "vitest";
import { runWhoami } from "./runWhoami";

const tokenKey = "PLUV_SESSION_TOKEN";

afterEach(() => {
    delete process.env[tokenKey];
    vi.unstubAllGlobals();
});

describe("runWhoami", () => {
    it("returns the account for the saved session", async () => {
        process.env[tokenKey] = "session-token";
        const authorizations: Array<string | null> = [];

        vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const headers = new Headers(init?.headers);

            authorizations.push(headers.get("authorization"));

            if (url.endsWith("/api/auth/session/jwt")) {
                return Response.json({ jwt: "jwt-token" });
            }

            if (url.endsWith("/api/auth/verify")) {
                return Response.json({
                    session: { id: "session" },
                    user: {
                        email: "ada@example.com",
                        id: "user",
                        image: null,
                        name: "Ada",
                        platformRole: "user",
                    },
                });
            }

            return new Response(null, { status: 404 });
        });

        await expect(runWhoami("/tmp")).resolves.toEqual({
            email: "ada@example.com",
            id: "user",
            name: "Ada",
        });
        expect(authorizations).toEqual(["Bearer session-token", "Bearer jwt-token"]);
    });

    it("asks for login when verify does not return a user", async () => {
        process.env[tokenKey] = "session-token";

        vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
            const url = String(input);

            if (url.endsWith("/api/auth/session/jwt")) return Response.json({ jwt: "jwt-token" });

            return Response.json({ session: null, user: null });
        });

        await expect(runWhoami("/tmp")).rejects.toThrow("Run pluv login.");
    });
});
