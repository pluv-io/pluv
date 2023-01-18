import type { Move, Square } from "chess.js";
import { Chess } from "chess.js";
import type { CSSProperties } from "react";
import { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { Chessboard } from "react-chessboard";

interface ChessMove {
    from: string;
    to: string;
    promotion?: string;
}

export interface ChessBoardRef {
    move: (notation: string) => void;
}

export interface ChessBoardMoveEvent {
    game: Chess;
    move: string;
}

export interface ChessBoardProps {
    className?: string;
    history: readonly string[];
    onMove?: (event: ChessBoardMoveEvent) => void;
    style?: CSSProperties;
}

export const ChessBoard = forwardRef<{}, ChessBoardProps>(
    ({ className, history = [], onMove, style }, ref) => {
        const clone = useCallback(
            (toClone: Chess) => new Chess(toClone.fen()),
            []
        );

        const game = useMemo((): Chess => {
            let didError: boolean = false;

            return history.reduce((board, notation) => {
                // truncate game history if we encounter an invalid move
                if (didError) return board;

                const copy = clone(board);

                try {
                    copy.move(notation);
                } catch {
                    didError = true;

                    return board;
                }

                return copy;
            }, new Chess());
        }, [clone, history]);

        const move = useCallback(
            (newMove: ChessMove | string): boolean => {
                const copy = clone(game);

                let move: Move | null = null;

                try {
                    move = copy.move(newMove);
                } catch {
                    return false;
                }

                if (!move) return false;

                const lastMove =
                    typeof newMove === "string"
                        ? newMove
                        : copy.history().slice(-1).pop();

                if (!lastMove) throw new Error("Error while making move");

                onMove?.({ game: copy, move: lastMove });

                return true;
            },
            [clone, game, onMove]
        );

        useImperativeHandle(ref, () => ({ move }), [move]);

        const onDrop = useCallback(
            (from: Square, to: Square): boolean => {
                // Always promote to queen for simplicity
                return move({ from, to, promotion: "q" });
            },
            [move]
        );

        return (
            <div className={className} style={style}>
                <Chessboard
                    customBoardStyle={{ width: "100%" }}
                    isDraggablePiece={() => !!onMove}
                    onPieceDrop={onDrop}
                    position={game.fen()}
                />
            </div>
        );
    }
);

ChessBoard.displayName = "ChessBoard";
