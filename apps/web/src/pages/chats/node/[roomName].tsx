import { y } from "@pluv/react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { NodeChatRoom } from "../../../components";
import { PluvRoomProvider } from "../../../pluv-io/node";

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
                    initialPresence={{
                        cursor: null,
                    }}
                    initialStorage={() => ({
                        messages: y.array(),
                    })}
                    room={roomName}
                >
                    <NodeChatRoom />
                </PluvRoomProvider>
            )}
        </div>
    );
};

export default Page;
