import type { Move, Square } from "chess.js";
import { Chess } from "chess.js";
import type { CSSProperties } from "react";
import { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { useChessSounds } from "./useChessSounds";

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
        const sounds = useChessSounds();

        const clone = useCallback((game: Chess) => {
            return game
                .history()
                .reduce(
                    (board, notation) => (board.move(notation), board),
                    new Chess()
                );
        }, []);

        // {
        //     // truncate game history if we encounter an invalid move
        //     if (didError) return board;

        //     const copy = clone(board);

        //     try {
        //         copy.move(notation);
        //     } catch {
        //         didError = true;

        //         return board;
        //     }

        //     return copy;
        // }

        const game = useMemo((): Chess => {
            let didError: boolean = false;

            const state = history.reduce(
                (board, notation) => (board.move(notation), board),
                new Chess()
            );

            return state;
        }, [history]);

        const move = useCallback(
            (newMove: ChessMove | string): boolean => {
                if (!onMove) return false;

                const copy = clone(game);

                let move: Move | null = null;

                try {
                    move = copy.move(newMove);
                } catch {
                    return false;
                }

                if (!move) return false;

                const lastMove = copy
                    .history({ verbose: true })
                    .slice(-1)
                    .pop();

                if (!lastMove) throw new Error("Error while making move");

                onMove({ game: copy, move: lastMove.san });

                if (copy.isGameOver()) sounds.gameEnd.play();
                else if (copy.isCheck()) sounds.check.play();
                else if (lastMove.captured) sounds.capture.play();
                else if (lastMove.promotion) sounds.promote.play();
                else if (lastMove.san.startsWith("0-0")) sounds.castle.play();
                else sounds.move.play();

                if (lastMove.promotion) sounds.promote.play();

                return true;
            },
            [clone, game, onMove, sounds]
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
                <div style={{ display: "none" }}>
                    {sounds.capture.element}
                    {sounds.castle.element}
                    {sounds.check.element}
                    {sounds.gameEnd.element}
                    {sounds.move.element}
                    {sounds.promote.element}
                </div>
            </div>
        );
    }
);

ChessBoard.displayName = "ChessBoard";
