import { createPluvHandler } from "@pluv/platform-cloudflare";
import { ioServer } from "./pluv-io";

export { ioServer } from "./pluv-io";

const CORS_VALID_DOMAINS = ["pluv.io", "pluv.vercel.app"] as const;
const CORS_MAX_AGE = 86_400;

const Pluv = createPluvHandler({
    binding: "rooms",
    io: ioServer,
    modify: (request, response) => {
        if (request.headers.get("Upgrade") === "websocket") return response;

        const isWhitelisted = CORS_VALID_DOMAINS.some((domain) => {
            return new RegExp(`https?://${domain}\/?`).test(request.url);
        });

        if (!isWhitelisted) return response;

        const { origin } = new URL(request.url);
        const headers = {
            "access-control-allow-origin": origin,
            "access-control-allow-methods": ["GET", "HEAD", "POST", "OPTIONS"].join(","),
            "access-control-max-age": `${CORS_MAX_AGE}`,
        };

        Object.entries(headers).map(([header, value]) => {
            response.headers.append(header, value);
        });

        return response;
    },
});

export const RoomDurableObject = Pluv.DurableObject;

export default Pluv.handler;
