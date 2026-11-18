import { z } from "zod";
import { authBase, appBase, type ServiceUrls } from "../session/endpoints";
import { requestJson } from "../session/request";
import { sessionFilePath, writeCliSession } from "../session/sessionFile";
import { createCliPkce } from "./createCliPkce";
import { listenForCliCode } from "./listenForCliCode";
import { openBrowser } from "./openBrowser";

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

const ZodCliToken = z.object({
    expiresAt: z.string().min(1),
    token: z.string().min(1),
});

/** Open the dashboard, exchange the one-time code, and save the CLI session. */
export const runLogin = async (
    cwd: string,
    urls?: ServiceUrls,
    onOpen?: (url: string) => void,
): Promise<string> => {
    const filePath = sessionFilePath(cwd);

    if (!filePath) {
        throw new Error(
            "No node_modules directory was found. Run pluv login from a project that has installed dependencies.",
        );
    }

    const { challenge, state, verifier } = createCliPkce();
    const origin = appBase(urls);
    const listener = await listenForCliCode({
        deniedUrl: new URL("/cli/denied", origin).toString(),
        grantedUrl: new URL("/cli/granted", origin).toString(),
    });
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    const finish = (ok: boolean): void => {
        if (finished) return;

        finished = true;
        listener.finish(ok);
    };

    try {
        const callback = `http://127.0.0.1:${listener.port}/callback`;
        const page = new URL("/cli", origin);

        page.searchParams.set("callback", callback);
        page.searchParams.set("challenge", challenge);
        page.searchParams.set("state", state);

        openBrowser(page.toString());
        onOpen?.(page.toString());

        const redirected = await Promise.race([
            listener.result,
            new Promise<never>((_, reject) => {
                timeout = setTimeout(() => {
                    reject(new Error("Login timed out. Run pluv login again."));
                }, LOGIN_TIMEOUT_MS);
            }),
        ]);

        if (redirected.state !== state) {
            throw new Error("Login state did not match. Run pluv login again.");
        }

        const session = await requestJson({
            url: new URL("/api/auth/cli/token", authBase(urls)),
            method: "POST",
            json: { code: redirected.code, verifier },
            schema: ZodCliToken,
            error: "Login could not be completed. Run pluv login again.",
        });

        await writeCliSession(filePath, session);
        finish(true);

        return `You're signed in. This session expires ${session.expiresAt}.`;
    } catch (error) {
        finish(false);
        throw error;
    } finally {
        if (timeout) clearTimeout(timeout);
        await listener.close();
    }
};
