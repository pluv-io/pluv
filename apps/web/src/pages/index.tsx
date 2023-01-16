import type { NextPage } from "next";
import dynamic from "next/dynamic";

const HomeHero = dynamic(() => import("../components/HomeHero"), {
    ssr: false,
});

export const Page: NextPage = () => {
    return (
        <div>
            <HomeHero className="h-96 w-full" />
        </div>
    );
};

export default Page;
