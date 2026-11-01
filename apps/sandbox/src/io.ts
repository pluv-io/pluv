import { createIO } from "@pluv/io";
import { platformPluv } from "@pluv/platform";
import { SANDBOX_SECRET } from "./secret";
import { treaty } from "./treaty";

const io = createIO().platform(platformPluv()).config({
    secret: SANDBOX_SECRET,
    treaty,
});

const storageUrl = (room: string): URL => {
    const origin = process.env.APP_ORIGIN;

    if (!origin) throw new Error("APP_ORIGIN is not set.");

    return new URL(`/api/rooms/${encodeURIComponent(room)}/storage`, origin);
};

const secretHeaders = (): Record<string, string> => ({
    "x-sandbox-secret": SANDBOX_SECRET,
});

export const ioServer = io.server({
    getInitialStorage: async ({ room }) => {
        const response = await fetch(storageUrl(room), { headers: secretHeaders() });

        if (response.status === 404) return null;

        if (!response.ok) {
            throw new Error(`Failed to load storage for ${room}: ${response.status}`);
        }

        const body = await response.text();

        return body.length > 0 ? body : null;
    },
    onStorageDestroyed: async ({ encodedState, room }) => {
        if (!encodedState) throw new Error(`Refusing to save empty storage for ${room}.`);

        const response = await fetch(storageUrl(room), {
            body: encodedState,
            headers: {
                ...secretHeaders(),
                "content-type": "text/plain; charset=utf-8",
            },
            method: "PUT",
        });

        if (!response.ok) {
            throw new Error(`Failed to save storage for ${room}: ${response.status}`);
        }
    },
});

export default ioServer;
