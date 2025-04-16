import { createPluvHandler } from "@pluv/platform-cloudflare";
import { ioServer } from "./pluv-io";

export type { ioServer } from "./pluv-io";

const Pluv = createPluvHandler({
    authorize: ({ env, request, room }) => {
        if (room.endsWith("repeat-user")) {
            const url = new URL(request.url);
            const id = url.searchParams.get("user_id") ?? crypto.randomUUID();

            return { id, name: `user:${id}` };
        }

        const id = crypto.randomUUID();

        return { id, name: `user:${id}` };
    },
    binding: "rooms",
    io: ioServer,
    modify(request, response) {
        if (request.headers.get("Upgrade") !== "websocket") {
            response.headers.append("access-control-allow-origin", "*");
        }

        return response;
    },
});

export const RoomDurableObject = Pluv.DurableObject;

export default Pluv.handler;
