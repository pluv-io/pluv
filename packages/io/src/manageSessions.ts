import type { IODefs } from "./IODefs";
import type { IORoom } from "./IORoom";
import type { SessionRoom } from "./types";
import { RoomSessionManager } from "./RoomSessionManager";

export function manageSessions<T extends IODefs = IODefs>(room: IORoom<T>): RoomSessionManager<T>;
export function manageSessions<T extends IODefs = IODefs>(
    room: SessionRoom<T>,
    platform: T["platform"],
): RoomSessionManager<T>;
export function manageSessions<T extends IODefs = IODefs>(
    room: IORoom<T> | SessionRoom<T>,
    platform?: T["platform"],
): RoomSessionManager<T> {
    const full = room as IORoom<T>;

    return new RoomSessionManager(full, platform ?? full._defs.platform);
}
