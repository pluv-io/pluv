import type { FC } from "react";
import {
    usePluvMyPresence,
    usePluvMyself,
    usePluvOthers,
} from "../pluv-io/node-redis";

export type NodeRedisPresenceRoomProps = Record<string, never>;

export const NodeRedisPresenceRoom: FC<NodeRedisPresenceRoomProps> = () => {
    const myself = usePluvMyself();
    const [myPresence, updateMyPresence] = usePluvMyPresence();
    const others = usePluvOthers();

    if (!myself) return null;

    return (
        <div id="presence-room">
            <div>Presence Room</div>
            <br />
            <button
                id="button-increment-count"
                onClick={() => {
                    updateMyPresence({ count: (myPresence?.count ?? 0) + 1 });
                }}
                type="button"
            >
                Increment
            </button>
            <br />
            <div id="my-presence" style={{ whiteSpace: "pre" }}>
                {JSON.stringify(myPresence, null, 2)}
            </div>
            <div id="others" style={{ whiteSpace: "pre" }}>
                {JSON.stringify(others, null, 2)}
            </div>
        </div>
    );
};
