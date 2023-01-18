import type { FC } from "react";
import { createContext } from "react";
import type { CustomPieceProps } from "./types";

export interface CustomBoardContextValue {
    customPiece?: FC<CustomPieceProps>;
}

export const ChessBoardContext = createContext<CustomBoardContextValue>({});
