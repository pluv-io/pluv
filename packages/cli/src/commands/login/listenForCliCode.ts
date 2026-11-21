import { createServer, type Server } from "node:http";
import { z } from "zod";

const ZodCallbackQuery = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
});

export type CliCallback = z.infer<typeof ZodCallbackQuery>;

const closeServer = (server: Server): Promise<void> => {
    return new Promise((resolve) => {
        server.close(() => resolve());
    });
};

const redirect = (response: import("node:http").ServerResponse, location: string): void => {
    response.writeHead(302, { location });
    response.end();
};

/**
 * Listen on 127.0.0.1 for the browser callback.
 * The response stays open until `finish` so the browser can be sent to granted or denied.
 */
export const listenForCliCode = async (pages: {
    deniedUrl: string;
    grantedUrl: string;
}): Promise<{
    close: () => Promise<void>;
    finish: (ok: boolean) => void;
    port: number;
    result: Promise<CliCallback>;
}> => {
    let resolveCallback: (callback: CliCallback) => void = () => undefined;
    let rejectCallback: (error: Error) => void = () => undefined;
    let settled = false;
    let respond: ((ok: boolean) => void) | null = null;
    const result = new Promise<CliCallback>((resolve, reject) => {
        resolveCallback = resolve;
        rejectCallback = reject;
    });
    const server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");

        if (url.pathname !== "/callback") {
            response.writeHead(404);
            response.end();

            return;
        }

        const parsed = ZodCallbackQuery.safeParse({
            code: url.searchParams.get("code"),
            state: url.searchParams.get("state"),
        });

        if (!parsed.success || settled) {
            redirect(response, pages.deniedUrl);

            if (!settled) {
                settled = true;
                rejectCallback(new Error("Login could not be completed. Run pluv login again."));
            }

            return;
        }

        settled = true;
        respond = (ok) => {
            redirect(response, ok ? pages.grantedUrl : pages.deniedUrl);
        };
        resolveCallback(parsed.data);
    });

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();

    if (!address || typeof address === "string") {
        await closeServer(server);
        throw new Error("Could not listen for the CLI login callback.");
    }

    return {
        close: () => closeServer(server),
        finish: (ok) => {
            respond?.(ok);
            respond = null;
        },
        port: address.port,
        result,
    };
};
