import {
    HomeBoxesDemoSection,
    HomeHero,
    HomeIntroSection,
} from "../components";
import type { NextPage } from "next";
import { PluvRoomProvider } from "../../pluv-io";

export const Page: NextPage = () => {
    return (
        <PluvRoomProvider
            initialPresence={{ demoChessSquare: null }}
            room="home-page"
        >
            <HomeHero className="w-full" />
            <HomeIntroSection />
            <HomeBoxesDemoSection />
        </PluvRoomProvider>
    );
};

export default Page;
