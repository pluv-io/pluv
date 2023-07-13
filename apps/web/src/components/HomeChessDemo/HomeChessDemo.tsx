import {
    ChessBoard,
    ChessBoardRef,
    ChessMoveHistory,
    LoadingChessBoard,
} from "@pluv-internal/react-chess";
import { y } from "@pluv/react";
import ms from "ms";
import {
    CSSProperties,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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

const BoardContainer = styled.div`
    ${tw`
        relative
    `}

    @media (max-width: 920px) {
        ${tw`
            w-full
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

const GameOver = tw.div`
    absolute
    top-1/2
    left-1/2
    -translate-x-1/2
    -translate-y-1/2
    flex
    flex-col
    items-center
    justify-center
    gap-1
    py-2
    px-4
    border-2
    border-solid
    border-indigo-800
    rounded-md
    shadow-lg
    shadow-indigo-700
    bg-zinc-800
    text-sm
    text-center
    text-white
    font-semibold
    z-10
`;

const Winner = tw.div`
    text-2xl
    font-bold
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
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | null>();
    const chessRef = useRef<ChessBoardRef>();

    const moveHistory = useMemo(
        () => demo?.chessHistory?.slice() ?? null,
        [demo],
    );

    const onGameOver = useCallback((winner: "b" | "w" | null) => {
        setGameOver(true);
        setWinner(
            winner === "b"
                ? "Black wins!"
                : winner === "w"
                ? "White wins!"
                : "Draw",
        );
    }, []);

    useEffect(() => {
        if (!gameOver) return;

        const timeout = setTimeout(() => {
            chessRef.current?.clear();

            sharedType?.set("chessHistory", y.array<string>([]));

            setGameOver(false);
        }, ms("5s"));

        return () => {
            clearTimeout(timeout);
        };
    }, [sharedType, gameOver]);

    return (
        <Root className={className} style={style}>
            <BoardContainer>
                {moveHistory ? (
                    <Board
                        history={moveHistory}
                        id="home-chess"
                        onGameOver={onGameOver}
                        onMove={({ game }) => {
                            sharedType?.set(
                                "chessHistory",
                                y.array(game.history()),
                            );
                        }}
                    />
                ) : (
                    <Board as={LoadingChessBoard} history={[]} />
                )}
                {gameOver && (
                    <GameOver>
                        <Winner>{winner}</Winner>
                        <div>Resetting...</div>
                    </GameOver>
                )}
            </BoardContainer>
            <MoveHistory history={moveHistory ?? []} />
        </Root>
    );
};
