import type { FC, ReactNode } from "react";
import { useContext } from "react";
import type {
    CustomPieceFn,
    CustomPieceFnArgs,
} from "react-chessboard/dist/chessboard/types";
import { ChessBoardContext } from "./context";

export const getCustomPiece = (piece: ReactNode): CustomPieceFn => {
    const CustomPiece: FC<CustomPieceFnArgs> = (props: CustomPieceFnArgs) => {
        const { isDragging, squareWidth } = props;

        const { customPiece } = useContext(ChessBoardContext);

        const children = (
            <svg viewBox="1 1 43 43" height={squareWidth} width={squareWidth}>
                {piece}
            </svg>
        );

        return customPiece?.({ children, isDragging, squareWidth }) ?? children;
    };

    CustomPiece.displayName = "CustomPiece";

    return CustomPiece as CustomPieceFn;
};
