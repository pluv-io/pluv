import { type NextPage } from "next";
import { useRouter } from "next/router";
import { ChatRoom } from "../../components";
import { PluvRoom } from "../../pluv-io";

const Page: NextPage = () => {
    const router = useRouter();

    if (!router.isReady) return null;

    const roomName = router.query.roomName as string;

    return (
        <PluvRoom.PluvRoomProvider
            initialPresence={{
                count: 0
            }}
            room={roomName}
        >
            <ChatRoom />
        </PluvRoom.PluvRoomProvider>
    );
};

export default Page;
