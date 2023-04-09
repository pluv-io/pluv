import {
    createRouter,
    DurableObjectUtils,
} from "@pluv-internal/cloudflare-utils";

export { RoomDurableObject } from "./durable-objects";
export { io } from "./pluv-io";

interface RouterContext {
    env: Env;
}

const getCorsHeaders = (origin: string, env: Env): Record<string, string> => {
    if (env.DEPLOY_ENV !== "production") return {};

    const corsHeaders = {
        "Access-Control-Allow-Origin": "https://pluv.io",
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
        "Access-Control-Max-Age": "86400",
    };

    const isWhitelisted = ["pluv.io", "pluv.vercel.app"].some((domain) => {
        const re = new RegExp(`(http|ws)s?://${domain}(/)?`);

        return re.test(domain);
    });

    if (!isWhitelisted) return corsHeaders;

    return {
        ...corsHeaders,
        "Access-Control-Allow-Origin": origin,
    };
};

const router = createRouter<RouterContext>()
    .path(
        "get",
        "/api/room/:rest*",
        async ({ rest }, { origin, request, context: { env } }) => {
            const [name] = rest;

            const roomId = DurableObjectUtils.isValidId(name)
                ? env.rooms.idFromString(name)
                : DurableObjectUtils.isValidName(name)
                ? env.rooms.idFromName(name)
                : env.rooms.newUniqueId();

            const room = env.rooms.get(roomId);

            return room.fetch(request);
        }
    )
    .path("get", "*", (_, { origin, context: { env } }) => {
        return new Response("ok", {
            headers: {
                ...getCorsHeaders(origin, env),
            },
        });
    });

const handler = {
    async fetch(request: Request, env: Env): Promise<Response> {
        const context: RouterContext = { env };

        return router.setConfig({ context }).match(request);
    },
};

export default handler;
