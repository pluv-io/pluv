import { y } from "@pluv/react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { CloudflareChatRoom } from "../../../components";
import { PluvRoomProvider } from "../../../pluv-io/cloudflare";

export const Page: NextPage = () => {
    const router = useRouter();

    const [enabled, setEnabled] = useState<boolean>(true);

    const roomName = router.query.roomName as string;

    if (!roomName) return null;

    return (
        <div>
            <button
                onClick={() => {
                    setEnabled(true);
                }}
                type="button"
            >
                Connect
            </button>
            <button
                onClick={() => {
                    setEnabled(false);
                }}
                type="button"
            >
                Disconnect
            </button>
            {enabled && (
                <PluvRoomProvider
                    debug={{
                        input: ["$UPDATE_STORAGE"],
                        output: ["$STORAGE_RECEIVED", "$STORAGE_UPDATED"],
                    }}
                    initialPresence={{
                        cursor: null,
                    }}
                    initialStorage={() => ({
                        messages: y.array(),
                    })}
                    room={roomName}
                >
                    <CloudflareChatRoom />
                </PluvRoomProvider>
            )}
        </div>
    );
};

export default Page;
