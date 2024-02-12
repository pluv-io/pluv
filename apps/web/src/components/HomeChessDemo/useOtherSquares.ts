import { useOthers } from "pluv-io";
import { useMemo } from "react";

export const useOtherSquares = (): Record<string, number> => {
    const otherSquares = useOthers((others) =>
        others.map((other) => other.presence.demoChessSquare),
    );

    return useMemo(() => {
        return otherSquares.reduce<Record<string, number>>(
            (counts, square) => ({
                ...counts,
                ...(square ? { [square]: (counts[square] ?? 0) + 1 } : {}),
            }),
            {},
        );
    }, [otherSquares]);
};
