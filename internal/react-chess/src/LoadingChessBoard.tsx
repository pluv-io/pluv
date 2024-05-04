import ms from "ms";
import { CSSProperties, FC, memo, useEffect, useState } from "react";
import tw, { styled } from "twin.macro";
import { KingPiece } from "./KingPiece";

const BOARD_SIZE = 8;

const Root = tw.div`
    grid
    grid-cols-8
    grid-rows-[8]
    aspect-square
`;

const Cell = tw.div`
    bg-slate-600
    aspect-square
    min-h-0
    min-w-0
`;

const RowNo = tw.span`
    absolute
    top-0
    left-0.5
    [font-size: 12.5px]
    text-slate-400
`;

const ColNo = tw.span`
    absolute
    bottom-0
    right-0.5
    [font-size: 12.5px]
    text-slate-600
`;

const SpinnerKing = tw(KingPiece)`
    animate-spin
`;

const Row = styled.div`
    ${tw`contents`}

    & > ${Cell} {
        ${tw`relative`}
    }

    &:nth-child(even) > ${Cell} {
        ${tw`even:bg-slate-400`}
    }

    &:nth-child(odd) > ${Cell} {
        ${tw`odd:bg-slate-400`}

        &:first-child > ${RowNo} {
            ${tw`text-slate-600`}
        }
    }

    &:last-child > ${Cell}:nth-child(odd) > ${ColNo} {
        ${tw`text-slate-400`}
    }
`;

export interface LoadingChessBoardChildProps {
    position: [row: number, col: number];
}

export type LoadingChessBoardChild = FC<LoadingChessBoardChildProps>;

export interface LoadingChessBoardProps {
    children?: LoadingChessBoardChild;
    className?: string;
    style?: CSSProperties;
}

export const LoadingChessBoard = memo<LoadingChessBoardProps>((props) => {
    const { children = () => <SpinnerKing />, className, style } = props;

    const [position, setPosition] = useState<[row: number, col: number]>([BOARD_SIZE / 2 - 1, BOARD_SIZE / 2 - 1]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPosition(([oldR, oldC]) => {
                if (oldR === 3 && oldC === 3) return [3, 4];
                if (oldR === 3 && oldC === 4) return [4, 4];
                if (oldR === 4 && oldC === 4) return [4, 3];
                return [3, 3];
            });
        }, ms("0.25s"));

        return () => {
            clearInterval(interval);
        };
    }, []);

    const [row, col] = position;

    return (
        <Root className={className} style={style}>
            {Array.from({ length: BOARD_SIZE }, (_, i) => (
                <Row key={i}>
                    {Array.from({ length: BOARD_SIZE }, (_, j) => (
                        <Cell key={j}>
                            {!j && <RowNo>{BOARD_SIZE - i}</RowNo>}
                            {i === BOARD_SIZE - 1 && <ColNo>{String.fromCharCode(65 + j).toLowerCase()}</ColNo>}
                            {row === i && col === j && children({ position })}
                        </Cell>
                    ))}
                </Row>
            ))}
        </Root>
    );
});

LoadingChessBoard.displayName = "LoadingChessBoard";
