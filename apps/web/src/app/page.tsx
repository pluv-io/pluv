import { FC } from "react";
import { HomeBoxesDemoSection } from "../components/HomeBoxesDemoSection";
import { HomeFeaturesSection } from "../components/HomeFeaturesSection";
import HomeHero from "../components/HomeHero";
import { HomeIntroSection } from "../components/HomeIntroSection";
import { PluvRoomProvider } from "../pluv-io/cloudflare";

export interface PageProps {}

const Page: FC<PageProps> = () => {
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
