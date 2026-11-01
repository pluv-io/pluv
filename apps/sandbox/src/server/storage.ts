import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { hasSandboxSecret } from "@/secret";
import { isRoomName } from "@/roomName";

const text = (body: string, status: number): Response => {
    return new Response(body, {
        headers: { "content-type": "text/plain; charset=utf-8" },
        status,
    });
};

export const readRoomStorage = (request: Request, room: string): Response => {
    if (!hasSandboxSecret(request)) return text("Unauthorized", 401);
    if (!isRoomName(room)) return text("Not found", 404);

    const row = db.select().from(rooms).where(eq(rooms.name, room)).get();

    if (!row?.storage) return text("Not found", 404);

    return text(row.storage, 200);
};

export const writeRoomStorage = async (request: Request, room: string): Promise<Response> => {
    if (!hasSandboxSecret(request)) return text("Unauthorized", 401);
    if (!isRoomName(room)) return text("Not found", 404);

    const storage = await request.text();

    if (storage.length === 0) return text("Missing storage", 400);

    db.insert(rooms)
        .values({ name: room, storage })
        .onConflictDoUpdate({ target: rooms.name, set: { storage } })
        .run();

    return text("ok", 200);
};
