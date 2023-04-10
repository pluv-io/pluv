import type { NextPage } from "next";
import tw from "twin.macro";
import { PluvRoomProvider } from "../../pluv-io";
import {
    HomeBoxesDemoSection,
    HomeFeaturesSection,
    HomeHero,
    HomeIntroSection,
    HomeTypeSafetyDemoSection,
    SiteWideLayout,
} from "../components";

const Root = tw(SiteWideLayout.Content)`
    p-0
`;

export const Page: NextPage = () => {
    return (
        <Root>
            <PluvRoomProvider
                debug={process.env.NODE_ENV === "development"}
                initialPresence={{ demoChessSquare: null }}
                room="home-page"
            >
                <HomeHero className="w-full" />
                <HomeIntroSection />
                <HomeFeaturesSection />
                <HomeBoxesDemoSection />
                <HomeTypeSafetyDemoSection />
            </PluvRoomProvider>
        </Root>
    );
};

export default Page;
