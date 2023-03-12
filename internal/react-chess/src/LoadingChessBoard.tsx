import { CSSProperties, memo } from "react";
import tw, { styled } from "twin.macro";

const BOARD_SIZE = 8;

const Root = tw.div`
    grid
    grid-cols-8
    grid-rows-[8]
    aspect-square
`;

const Cell = styled.div`
    ${tw`
        bg-slate-600
    `}
`;

const RowNo = styled.span`
    ${tw`
        absolute
        top-0
        left-0.5
        [font-size: 12.5px]
        text-slate-400
    `}
`;

const ColNo = styled.span`
    ${tw`
        absolute
        bottom-0
        right-0.5
        [font-size: 12.5px]
        text-slate-600
    `}
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
        ${tw`
            text-slate-400
        `}
    }
`;

export interface LoadingChessBoardProps {
    className?: string;
    style?: CSSProperties;
}

export const LoadingChessBoard = memo<LoadingChessBoardProps>((props) => {
    const { className, style } = props;

    return (
        <Root className={className} style={style}>
            {Array.from({ length: BOARD_SIZE }, (_, i) => (
                <Row key={i}>
                    {Array.from({ length: BOARD_SIZE }, (_, j) => (
                        <Cell key={j}>
                            {!j && <RowNo>{BOARD_SIZE - i}</RowNo>}
                            {i === BOARD_SIZE - 1 && (
                                <ColNo>
                                    {String.fromCharCode(65 + j).toLowerCase()}
                                </ColNo>
                            )}
                        </Cell>
                    ))}
                </Row>
            ))}
        </Root>
    );
});

LoadingChessBoard.displayName = "LoadingChessBoard";
