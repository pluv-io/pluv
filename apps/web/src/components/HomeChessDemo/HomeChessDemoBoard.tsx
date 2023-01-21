import { ChessBoard } from "@pluv-internal/react-chess";
import { y } from "@pluv/react";
import { CSSProperties, FC, useMemo } from "react";
import { PluvRoomProvider, usePluvStorage } from "../../pluv-io/cloudflare";

export interface HomeChessDemoBoardProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeChessDemoBoard: FC<HomeChessDemoBoardProps> = ({
    className,
    style,
}) => {
    const [demo, sharedType] = usePluvStorage("demo");

    const history = useMemo(() => demo?.chessHistory?.slice() ?? [], [demo]);

    return (
        <ChessBoard
            className={className}
            history={history}
            onMove={({ game }) => {
                sharedType?.set("chessHistory", y.array(game.history()));
            }}
            style={style}
        />
    );
};
