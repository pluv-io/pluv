import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { PresenceRoom } from "../../../../components/yjs/node";
import { PluvRoomProvider } from "../../../../pluv-io/yjs/node";

export const Page: NextPage = () => {
    const router = useRouter();

    const [enabled, setEnabled] = useState<boolean>(true);

    if (!router.isReady) return null;

    const roomId = (router.query.room as string) ?? "e2e-node-presence";

    return (
        <div>
            <button
                id="connect-room"
                onClick={() => {
                    setEnabled(true);
                }}
                type="button"
            >
                Connect
            </button>
            <button
                id="disconnect-room"
                onClick={() => {
                    setEnabled(false);
                }}
                type="button"
            >
                Disconnect
            </button>
            <div>roomId: {roomId}</div>
            {enabled && (
                <PluvRoomProvider initialPresence={{ count: 0 }} room={roomId}>
                    <PresenceRoom />
                </PluvRoomProvider>
            )}
        </div>
    );
};

export default Page;
