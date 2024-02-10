import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { CloudflarePresenceRoom } from "../../../components";
import { PluvRoomProvider } from "../../../pluv-io/yjs/cloudflare";

export const Page: NextPage = () => {
    const router = useRouter();

    const [enabled, setEnabled] = useState<boolean>(true);

    if (!router.isReady) return null;

    const roomId = (router.query.room as string) ?? "e2e-cloudflare-presence";

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
                <PluvRoomProvider
                    debug={{
                        input: ["$GET_OTHERS", "SEND_MESSAGE"],
                        output: ["$REGISTERED"],
                    }}
                    initialPresence={{ count: 0 }}
                    room={roomId}
                >
                    <CloudflarePresenceRoom />
                </PluvRoomProvider>
            )}
        </div>
    );
};

export default Page;
