import type { ReactNode } from "react";

export interface ChessMove {
    from: string;
    to: string;
    promotion?: string;
}

export interface CustomPieceProps {
    children: ReactNode;
    isDragging: boolean;
    squareWidth: number;
}
