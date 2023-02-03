import { ChessBoard } from "@pluv-internal/react-chess";
import { y } from "@pluv/react";
import { CSSProperties, FC, useMemo } from "react";
import { usePluvStorage } from "../../pluv-io/cloudflare";

export interface HomeChessDemoProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeChessDemo: FC<HomeChessDemoProps> = ({ className, style }) => {
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
