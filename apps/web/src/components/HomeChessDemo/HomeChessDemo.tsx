import { ChessBoard, ChessMoveHistory } from "@pluv-internal/react-chess";
import { y } from "@pluv/react";
import { CSSProperties, FC, useMemo } from "react";
import tw, { styled } from "twin.macro";
import { usePluvStorage } from "../../pluv-io/cloudflare";

const Root = styled.div`
    ${tw`
        flex
        flex-row
        items-stretch
        justify-center
        gap-[32px]
        h-[600px]
    `}

    @media (max-width: 920px) {
        ${tw`
            h-auto
        `}
    }
`;

const Board = styled(ChessBoard)`
    ${tw`
        min-w-0
        w-[600px]
        h-[600px]
    `}

    @media (max-width: 920px) {
        ${tw`
            w-full
            h-auto
        `}
    }
`;

const MoveHistory = styled(ChessMoveHistory)`
    ${tw`
        shrink-0
        w-[208px]
    `}

    @media (max-width: 920px) {
        display: none !important;
    }
`;

export interface HomeChessDemoProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeChessDemo: FC<HomeChessDemoProps> = ({ className, style }) => {
    const [demo, sharedType] = usePluvStorage("demo");

    const history = useMemo(() => demo?.chessHistory?.slice() ?? [], [demo]);

    return (
        <Root className={className} style={style}>
            <Board
                history={history}
                onMove={({ game }) => {
                    sharedType?.set("chessHistory", y.array(game.history()));
                }}
            />
            <MoveHistory history={history} />
        </Root>
    );
};
