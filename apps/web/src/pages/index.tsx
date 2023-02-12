import { HomeHero, HomeIntroSection } from "../components";
import type { NextPage } from "next";
import { PluvRoomProvider } from "../../pluv-io";

export const Page: NextPage = () => {
    return (
        <PluvRoomProvider room="home-page">
            <HomeHero className="w-full" />
            <HomeIntroSection />
        </PluvRoomProvider>
    );
};

export default Page;
