import { afterEach, describe, expect, it } from "vitest";
import { listenForCliCode } from "./listenForCliCode";

const pages = {
    deniedUrl: "https://app.test/cli/denied",
    grantedUrl: "https://app.test/cli/granted",
};

describe("listenForCliCode", () => {
    const closers: Array<() => Promise<void>> = [];

    afterEach(async () => {
        await Promise.all(closers.splice(0).map((close) => close()));
    });

    it("sends the browser to granted after the login succeeds", async () => {
        const listener = await listenForCliCode(pages);

        closers.push(listener.close);

        const pending = fetch(`http://127.0.0.1:${listener.port}/callback?code=abc&state=xyz`, {
            redirect: "manual",
        });
        const callback = await listener.result;

        expect(callback).toEqual({ code: "abc", state: "xyz" });
        listener.finish(true);

        const response = await pending;

        expect(response.status).toBe(302);
        expect(response.headers.get("location")).toBe(pages.grantedUrl);
    });

    it("sends the browser to denied when the login fails", async () => {
        const listener = await listenForCliCode(pages);

        closers.push(listener.close);

        const pending = fetch(`http://127.0.0.1:${listener.port}/callback?code=abc&state=xyz`, {
            redirect: "manual",
        });

        await listener.result;
        listener.finish(false);

        const response = await pending;

        expect(response.status).toBe(302);
        expect(response.headers.get("location")).toBe(pages.deniedUrl);
    });

    it("sends a bad callback to denied immediately", async () => {
        const listener = await listenForCliCode(pages);

        closers.push(listener.close);

        const failed = listener.result.then(
            () => null,
            (error: unknown) => error,
        );
        const response = await fetch(`http://127.0.0.1:${listener.port}/callback`, {
            redirect: "manual",
        });

        expect(response.status).toBe(302);
        expect(response.headers.get("location")).toBe(pages.deniedUrl);
        expect(await failed).toBeInstanceOf(Error);
    });
});
