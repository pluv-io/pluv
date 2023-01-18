import { ChessBoard } from "@pluv-internal/react-chess";
import type { NextPage } from "next";
import dynamic from "next/dynamic";
import { useState } from "react";

const HomeHero = dynamic(() => import("../components/HomeHero"), {
    ssr: false,
});

export const Page: NextPage = () => {
    const [moves, setMoves] = useState<readonly string[]>([]);

    return (
        <div>
            <HomeHero className="h-[80vh] w-full" />
            <ChessBoard
                className="w-[600px]"
                history={moves}
                onMove={({ game }) => {
                    setMoves(game.history());
                }}
            />
        </div>
    );
};

export default Page;
