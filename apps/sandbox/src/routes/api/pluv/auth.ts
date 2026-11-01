import { createFileRoute } from "@tanstack/react-router";
import { authorizeRoom } from "@/server/authorize";

export const Route = createFileRoute("/api/pluv/auth")({
    server: {
        handlers: {
            GET: ({ request }) => authorizeRoom(request),
        },
    },
});
