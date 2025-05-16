import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { BlockNoteEditor } from "../../../../components/yjs/cloudflare";
import { useNoSsr } from "../../../../hooks/useNoSsr";
import { PluvRoomProvider } from "../../../../pluv-io/yjs/cloudflare";

export const Page: NextPage = () => {
    const noSsr = useNoSsr();
    const router = useRouter();

    const [enabled, setEnabled] = useState<boolean>(true);

    if (!router.isReady) return null;

    const roomId = (router.query.room as string) ?? "e2e-cloudflare-blocknote";

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
            <div>roomId: {roomId}</div>
            {enabled && (
                <PluvRoomProvider debug initialPresence={{ count: 0 }} metadata={{}} room={roomId}>
                    <BlockNoteEditor />
                </PluvRoomProvider>
            )}
        </div>,
    );
};

export default Page;
