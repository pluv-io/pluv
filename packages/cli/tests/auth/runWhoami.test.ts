import { afterEach, describe, expect, it, vi } from "vitest";
import { cacheServiceUrls, resetServiceUrlsCache } from "../../src/config/serviceUrls";
import { runWhoami } from "../../src/commands/whoami/runWhoami";
import { defaultPluvConfigInternal } from "../../src/schemas";

const tokenKey = "PLUV_SESSION_TOKEN";

const requestUrl = (value: RequestInfo | URL): string => {
    if (typeof value === "string") return value;
    if (value instanceof URL) return value.href;

    return value.url;
};

afterEach(() => {
    delete process.env[tokenKey];
    resetServiceUrlsCache();
    vi.unstubAllGlobals();
});

describe("runWhoami", () => {
    it("returns the account for the saved session", async () => {
        cacheServiceUrls(defaultPluvConfigInternal);
        process.env[tokenKey] = "session-token";
        const authorizations: Array<string | null> = [];

        vi.stubGlobal("fetch", async (request: RequestInfo | URL, init?: RequestInit) => {
            const url = requestUrl(request);
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

        await expect(runWhoami()).resolves.toEqual({
            email: "ada@example.com",
            id: "user",
            name: "Ada",
        });
        expect(authorizations).toEqual(["Bearer session-token", "Bearer jwt-token"]);
    });

    it("asks for login when verify does not return a user", async () => {
        cacheServiceUrls(defaultPluvConfigInternal);
        process.env[tokenKey] = "session-token";

        vi.stubGlobal("fetch", async (request: RequestInfo | URL) => {
            const url = requestUrl(request);

            if (url.endsWith("/api/auth/session/jwt")) {
                return Response.json({ jwt: "jwt-token" });
            }

            return Response.json({ session: null, user: null });
        });

        await expect(runWhoami()).rejects.toThrow("Run pluv login.");
    });
});
