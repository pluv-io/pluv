import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { StorageRoom } from "../../../../components/yjs/cloudflare";
import { useNoSsr } from "../../../../hooks/useNoSsr";
import { PluvRoomProvider } from "../../../../pluv-io/yjs/cloudflare";

export const Page: NextPage = () => {
    const noSsr = useNoSsr();
    const router = useRouter();

    const [enabled, setEnabled] = useState<boolean>(true);
    const [room2Id, setRoom2Id] = useState<string | null>(null);

    if (!router.isReady) return null;

    const queryRoomId = (router.query.room as string) ?? "e2e-cloudflare-storage";
    const roomId = room2Id ?? queryRoomId;

    return noSsr(
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
            <button
                id="toggle-room"
                onClick={() => {
                    setRoom2Id((prev) => (!!prev ? null : `${queryRoomId}_2`));
                }}
                type="button"
            >
                Toggle room 2
            </button>
            <div>roomId: {roomId}</div>
            {enabled && (
                <PluvRoomProvider debug initialPresence={{ count: 0 }} metadata={{}} room={roomId}>
                    <StorageRoom />
                </PluvRoomProvider>
            )}
        </div>,
    );
};

export default Page;
