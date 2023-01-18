import type { CustomPieces } from "react-chessboard/dist/chessboard/types";
import { defaultPieces } from "./defaultPieces";
import { getCustomPiece } from "./getCustomPiece";

export const customPieces: CustomPieces = {
    bP: getCustomPiece(defaultPieces.bP),
    bN: getCustomPiece(defaultPieces.bN),
    bB: getCustomPiece(defaultPieces.bB),
    bR: getCustomPiece(defaultPieces.bR),
    bQ: getCustomPiece(defaultPieces.bQ),
    bK: getCustomPiece(defaultPieces.bK),
    wP: getCustomPiece(defaultPieces.wP),
    wN: getCustomPiece(defaultPieces.wN),
    wB: getCustomPiece(defaultPieces.wB),
    wR: getCustomPiece(defaultPieces.wR),
    wQ: getCustomPiece(defaultPieces.wQ),
    wK: getCustomPiece(defaultPieces.wK),
};
