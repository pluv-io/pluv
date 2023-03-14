import {
    HomeBoxesDemoSection,
    HomeFeaturesSection,
    HomeHero,
    HomeIntroSection,
    HomeTypeSafetyDemoSection,
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
            <HomeFeaturesSection />
            <HomeBoxesDemoSection />
            <HomeTypeSafetyDemoSection />
        </PluvRoomProvider>
    );
};

(Page as any).style = { padding: 0 };

export default Page;
