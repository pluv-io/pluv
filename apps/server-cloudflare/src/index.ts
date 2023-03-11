import {
    createRouter,
    DurableObjectUtils,
} from "@pluv-internal/cloudflare-utils";

export { RoomDurableObject } from "./durable-objects";
export { io } from "./pluv-io";

interface RouterContext {
    env: Env;
}

const router = createRouter<RouterContext>().path(
    "get",
    "/api/room/:rest*",
    async ({ rest }, { request, context: { env } }) => {
        const [name] = rest;

        const roomId = DurableObjectUtils.isValidId(name)
            ? env.rooms.idFromString(name)
            : DurableObjectUtils.isValidName(name)
            ? env.rooms.idFromName(name)
            : env.rooms.newUniqueId();

        const room = env.rooms.get(roomId);

        return room.fetch(request);
    }
);

const handler = {
    async fetch(request: Request, env: Env): Promise<Response> {
        const context: RouterContext = { env };

        return router.setConfig({ context }).match(request);
    },
};

export default handler;
