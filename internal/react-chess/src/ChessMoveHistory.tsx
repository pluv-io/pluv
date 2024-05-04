import { useMemo } from "react";
import { CSSProperties, FC } from "react";
import tw from "twin.macro";

const Root = tw.div`
    flex
    flex-col
    items-stretch
    w-[208px]
`;

const Row = tw.div`
    shrink-0
    flex
    flex-row
    items-center
    justify-between
    gap-1
    h-6
    text-sm
    font-medium
`;

const HeaderRow = tw(Row)`
    mb-2
    pt-2
    px-2
    [& > *]:font-bold
`;

const Moves = tw.div`
    [overflow-y: overlay]
    p-2
`;

const TurnNo = tw.span`
    basis-auto
    shrink-0
    w-8
    min-w-0
`;

const TurnPlayer = tw.span`
    basis-auto
    shrink-0
    w-16
    min-w-0
`;

type MoveTurn = readonly [white: string, black: string | null];

export interface ChessMoveHistoryProps {
    className?: string;
    history: readonly string[];
    style?: CSSProperties;
}

export const ChessMoveHistory: FC<ChessMoveHistoryProps> = ({ className, history, style }) => {
    const turns: readonly MoveTurn[] = useMemo(() => {
        return history.reduce<MoveTurn[]>((acc, move, i) => {
            const lastWhite = acc.slice(-1)?.[0]?.[0] ?? null;
            const isWhiteTurn = !(i % 2);

            return isWhiteTurn ? [...acc, [move, null]] : [...acc.slice(0, -1), [lastWhite, move]];
        }, []);
    }, [history]);

    return (
        <Root className={className} style={style} aria-label="Move history">
            <HeaderRow>
                <TurnNo>Turn</TurnNo>
                <TurnPlayer>White</TurnPlayer>
                <TurnPlayer>Black</TurnPlayer>
            </HeaderRow>
            <Moves>
                {turns.map(([white, black], i) => {
                    const turnLabel = (i + 1).toLocaleString();

                    return (
                        <Row key={i} aria-label={`Turn ${turnLabel}`}>
                            <TurnNo>{turnLabel}.</TurnNo>
                            <TurnPlayer aria-label="White">{white}</TurnPlayer>
                            <TurnPlayer aria-label="Black">{black}</TurnPlayer>
                        </Row>
                    );
                })}
            </Moves>
        </Root>
    );
};
