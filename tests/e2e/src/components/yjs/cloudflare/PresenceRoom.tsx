import type { FC } from "react";
import {
    useMyPresence,
    useMyself,
    useOthers,
} from "../../../pluv-io/yjs/cloudflare";

export type PresenceRoomProps = Record<string, never>;

export const PresenceRoom: FC<PresenceRoomProps> = () => {
    const myself = useMyself();
    const [myPresence, updateMyPresence] = useMyPresence();
    const others = useOthers();

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
