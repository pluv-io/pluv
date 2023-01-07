import {
    createRouter,
    DurableObjectUtils,
    UrlUtils,
} from "@pluv-internal/cloudflare-utils";
import { io } from "./pluv-io";
import { getRoomId } from "./utils";

export { RoomDurableObject } from "./durable-objects";
export { io } from "./pluv-io";

interface RouterContext {
    env: Env;
}

const router = createRouter<RouterContext>()
    .path(
        "get",
        "/api/authorize",
        async (params, { context: { env }, query }) => {
            const roomName = (query.roomName ?? "") as string;
            const roomId = getRoomId(roomName, env);

            if (!roomId) {
                return new Response(
                    JSON.stringify({
                        error: `Room does not exist: ${roomName}`,
                    }),
                    {
                        headers: { "access-control-allow-origin": "*" },
                        status: 404,
                    }
                );
            }

            const id = crypto.randomUUID();

            const token = await io.createToken({
                room: roomId.toString(),
                user: {
                    id,
                    name: `user:${id}`,
                },
            });

            return new Response(token, {
                headers: { "access-control-allow-origin": "*" },
                status: 200,
            });
        }
    )
    .path("post", "/api/room", async (params, { context: { env } }) => {
        const roomId = env.rooms.newUniqueId();

        return new Response(roomId.toString(), {
            headers: { "access-control-allow-origin": "*" },
        });
    })
    .path(
        "get",
        "/api/room/:rest*",
        async ({ rest }, { request, context: { env } }) => {
            const [name, ...restPath] = rest;
            const forwardUrl = `/${restPath.join("/")}`;

            const roomId = DurableObjectUtils.isValidId(name)
                ? env.rooms.idFromString(name)
                : DurableObjectUtils.isValidName(name)
                ? env.rooms.idFromName(name)
                : null;

            if (!roomId) {
                return new Response("Name is invalid", { status: 404 });
            }

            const room = env.rooms.get(roomId);

            const requestUrl = UrlUtils.relative(request, forwardUrl);

            return room.fetch(requestUrl, request);
        }
    );

const handler = {
    async fetch(request: Request, env: Env): Promise<Response> {
        const context: RouterContext = { env };

        return router.setConfig({ context }).match(request);
    },
};

export default handler;
