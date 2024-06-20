import type { FC } from "react";
import { HomeDemo } from "../components/HeroDemo";
import { HomeBoxesDemoSection } from "../components/HomeBoxesDemoSection";
import { HomeFeaturesSection } from "../components/HomeFeaturesSection";
import HomeHero from "../components/HomeHero";
import { HomeIntroSection } from "../components/HomeIntroSection";
import { PluvRoomProvider } from "../pluv-io/cloudflare";
import { PageContainer } from "@pluv-internal/react-components/either";

export interface PageProps {}

const Page: FC<PageProps> = () => {
    return (
        <PluvRoomProvider
            debug={process.env.NODE_ENV === "development"}
            initialPresence={{ demoChessSquare: null }}
            room="home-page"
        >
            <HomeHero className="w-full" />
            <PageContainer className="flex flex-col items-center">
                <HomeDemo className="w-full max-w-screen-xl" />
            </PageContainer>
            <HomeIntroSection />
            <HomeFeaturesSection />
            <HomeBoxesDemoSection />
        </PluvRoomProvider>
    );
};

export default Page;
