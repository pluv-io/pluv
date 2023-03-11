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
        h-[720px]
    `}

    @media (max-width: 1080px) {
        ${tw`
            h-auto
        `}
    }
`;

const Board = styled(ChessBoard)`
    ${tw`
        min-w-0
        w-[720px]
        h-[720px]
        border-8
        border-solid
        border-indigo-800
        rounded-md
        overflow-hidden
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
        border-4
        border-solid
        border-indigo-800
        rounded-md
        overflow-hidden
        bg-zinc-800
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

    const moveHistory = useMemo(
        () => demo?.chessHistory?.slice() ?? null,
        [demo]
    );

    if (!moveHistory) return null;

    return (
        <Root className={className} style={style}>
            <Board
                history={moveHistory}
                id="home-chess"
                onMove={({ game }) => {
                    sharedType?.set("chessHistory", y.array(game.history()));
                }}
            />
            <MoveHistory history={moveHistory ?? []} />
        </Root>
    );
};
