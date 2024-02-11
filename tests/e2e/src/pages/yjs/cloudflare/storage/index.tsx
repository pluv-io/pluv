import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { StorageRoom } from "../../../../components/yjs/cloudflare";
import { PluvRoomProvider } from "../../../../pluv-io/yjs/cloudflare";

export const Page: NextPage = () => {
    const router = useRouter();

    const [enabled, setEnabled] = useState<boolean>(true);

    if (!router.isReady) return null;

    const roomId = (router.query.room as string) ?? "e2e-cloudflare-storage";

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
                        input: ["$UPDATE_STORAGE"],
                        output: ["$STORAGE_UPDATED", "$STORAGE_RECEIVED"],
                    }}
                    initialPresence={{ count: 0 }}
                    room={roomId}
                >
                    <StorageRoom />
                </PluvRoomProvider>
            )}
        </div>
    );
};

export default Page;
