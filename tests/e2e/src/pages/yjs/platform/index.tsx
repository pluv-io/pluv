import type { NextPage } from "next";
import { useRouter } from "next/router";
import { PlatformRoom } from "../../../components/yjs/platform/PlatformRoom";
import { useNoSsr } from "../../../hooks/useNoSsr";
import { PluvRoomProvider } from "../../../pluv-io/yjs/platform";

export const Page: NextPage = () => {
    const noSsr = useNoSsr();
    const router = useRouter();

    if (!router.isReady) return null;

    const room = (router.query.room as string) ?? "e2e-platform";

    return noSsr(
        <PluvRoomProvider debug initialPresence={{ count: 0 }} metadata={{}} room={room}>
            <PlatformRoom />
        </PluvRoomProvider>,
    );
};

export default Page;
