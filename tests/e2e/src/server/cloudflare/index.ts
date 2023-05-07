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
    modify(request, response) {
        if (request.headers.get("Upgrade") !== "websocket") {
            response.headers.append("access-control-allow-origin", "*");
        }

        return response;
    },
});

export const RoomDurableObject = Pluv.DurableObject;

export default Pluv.handler;
