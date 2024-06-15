import type { NextPage } from "next";
import { PluvRoomProvider } from "../../pluv-io";
import { HomeBoxesDemoSection, HomeFeaturesSection, HomeHero, HomeIntroSection } from "../components";

export const Page: NextPage = () => {
    return (
        <PluvRoomProvider
            debug={process.env.NODE_ENV === "development"}
            initialPresence={{ demoChessSquare: null }}
            room="home-page"
        >
            <HomeHero className="w-full" />
            <HomeIntroSection />
            <HomeFeaturesSection />
            <HomeBoxesDemoSection />
        </PluvRoomProvider>
    );
};

export default Page;
