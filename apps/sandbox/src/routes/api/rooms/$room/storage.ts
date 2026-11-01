import { createFileRoute } from "@tanstack/react-router";
import { readRoomStorage, writeRoomStorage } from "@/server/storage";

export const Route = createFileRoute("/api/rooms/$room/storage")({
    server: {
        handlers: {
            GET: ({ params, request }) => readRoomStorage(request, params.room),
            PUT: ({ params, request }) => writeRoomStorage(request, params.room),
        },
    },
});
