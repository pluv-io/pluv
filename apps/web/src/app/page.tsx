import { PageContainer } from "@pluv-internal/react-components/either";
import type { FC } from "react";
import { HomeDemo } from "../components/HeroDemo";
import { HomeBoxesDemoSection } from "../components/HomeBoxesDemoSection";
import { HomeFeaturesSection } from "../components/HomeFeaturesSection";
import HomeHero from "../components/HomeHero";
import { HomeIntroSection } from "../components/HomeIntroSection";
import { HomePluvProvider } from "../components/HomePluvProvider";

export interface PageProps {}

const Page: FC<PageProps> = () => {
    return (
        <HomePluvProvider>
            <HomeHero className="w-full" />
            <PageContainer className="flex flex-col items-center">
                <HomeDemo className="w-full max-w-screen-xl" />
            </PageContainer>
            <HomeIntroSection />
            <HomeFeaturesSection />
            <HomeBoxesDemoSection />
        </HomePluvProvider>
    );
};

export default Page;
