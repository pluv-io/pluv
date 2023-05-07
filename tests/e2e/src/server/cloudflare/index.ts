import { createPluvHandler } from "@pluv/platform-cloudflare";
import { io } from "./pluv-io";

export type { io } from "./pluv-io";

const Pluv = createPluvHandler({
    authorize: () => {
        const id = crypto.randomUUID();

        return { id, name: `user:${id}` };
    },
    binding: "rooms",
    io,
});

export const RoomDurableObject = Pluv.DurableObject;

const handler = {
    async fetch(request: Request, env: Env): Promise<Response> {
        const response =
            (await Pluv.handler(request, env)) ??
            new Response("Not Found", {
                headers: { "Content-Type": "text/plain" },
                status: 404,
            });

        response.headers.set("access-control-allow-origin", "*");

        return response;
    },
};

export default handler;
