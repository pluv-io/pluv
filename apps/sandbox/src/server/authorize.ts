import { db } from "@/db";
import { users } from "@/db/schema";
import { ioServer } from "@/io";
import { isRoomName } from "@/roomName";

export const authorizeRoom = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const room = url.searchParams.get("room") ?? "";
    const id = url.searchParams.get("user") ?? "";
    const name = url.searchParams.get("name") ?? "";

    if (!isRoomName(room) || id.length === 0 || name.length === 0) {
        return new Response("Missing room, user, or name.", { status: 400 });
    }

    db.insert(users)
        .values({ id, name })
        .onConflictDoUpdate({ target: users.id, set: { name } })
        .run();

    const token = await ioServer.createToken({ room, user: { id, name } });

    return new Response(token, {
        headers: { "content-type": "text/plain; charset=utf-8" },
        status: 200,
    });
};
