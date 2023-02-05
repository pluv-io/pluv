import { ChessBoard } from "@pluv-internal/react-chess";
import type { NextPage } from "next";
import { useState } from "react";
import { HomeHero } from "../components/HomeHero";

export const Page: NextPage = () => {
    const [moves, setMoves] = useState<readonly string[]>([]);

    return (
        <div>
            <HomeHero className="w-full" />
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
