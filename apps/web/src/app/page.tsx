import { PageContainer } from "@pluv-internal/react-components/either";
import { Metadata, ServerRuntime } from "next";
import type { FC } from "react";
import { HomeBoxesDemoSection } from "../components/HomeBoxesDemoSection";
import { HomeDemo } from "../components/HomeDemo";
import { HomeFeaturesSection } from "../components/HomeFeaturesSection";
import HomeHero from "../components/HomeHero";
import { HomeIntroSection } from "../components/HomeIntroSection";
import { HomePluvProvider } from "../components/HomePluvProvider";
import { PresenceTooltipProvider } from "../components/PresenceTooltip";

export const runtime: ServerRuntime = "nodejs";

export const metadata: Metadata = {
    title: "pluv.io",
    description: "Open Source, multiplayer APIs powered-by TypeScript inference end-to-end.",
};

export interface PageProps {}

const Page: FC<PageProps> = () => {
    return (
        <HomePluvProvider>
            <PresenceTooltipProvider>
                <HomeHero className="w-full" />
                <PageContainer className="flex flex-col items-center">
                    <HomeDemo className="w-full max-w-screen-xl" />
                </PageContainer>
                <HomeFeaturesSection className="mt-32" />
                <HomeIntroSection />
                <HomeBoxesDemoSection />
            </PresenceTooltipProvider>
        </HomePluvProvider>
    );
};

export default Page;
