import type { CSSProperties, FC } from "react";
import { PluvRoomProvider } from "../../pluv-io/cloudflare";
import { HomeChessDemoBoard } from "./HomeChessDemoBoard";

export interface HomeChessDemoProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeChessDemo: FC<HomeChessDemoProps> = ({ className, style }) => {
    return (
        <PluvRoomProvider room="home-chess">
            <HomeChessDemoBoard className={className} style={style} />
        </PluvRoomProvider>
    );
};
