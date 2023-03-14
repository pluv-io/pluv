import type { Move, Square } from "chess.js";
import { Chess } from "chess.js";
import type { CSSProperties, FC } from "react";
import { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { theme } from "twin.macro";
import { ChessBoardContext } from "./context";
import { customPieces } from "./customPieces";
import type { ChessMove, CustomPieceProps } from "./types";
import { useChessSounds } from "./useChessSounds";

export interface ChessBoardRef {
    move: (notation: string) => void;
}

export interface ChessBoardMoveEvent {
    game: Chess;
    move: string;
}

export interface ChessBoardProps {
    className?: string;
    customPiece?: FC<CustomPieceProps>;
    history: readonly string[];
    id?: string;
    onMove?: (event: ChessBoardMoveEvent) => void;
    onSquareSelect?: (square: Square) => void;
    style?: CSSProperties;
}

export const ChessBoard = forwardRef<ChessBoardRef, ChessBoardProps>(
    (props, ref) => {
        const {
            className,
            customPiece,
            history = [],
            id,
            onMove,
            onSquareSelect,
            style,
        } = props;

        const sounds = useChessSounds();

        const clone = useCallback((game: Chess) => {
            return game
                .history()
                .reduce(
                    (board, notation) => (board.move(notation), board),
                    new Chess()
                );
        }, []);

        const game = useMemo((): Chess => {
            return history.reduce(
                (board, notation) => (board.move(notation), board),
                new Chess()
            );
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
                onSquareSelect?.(to);

                // Always promote to queen for simplicity
                return move({ from, to, promotion: "q" });
            },
            [move, onSquareSelect]
        );

        return (
            <div id={id} className={className} style={style}>
                <ChessBoardContext.Provider value={{ customPiece }}>
                    <Chessboard
                        customBoardStyle={{ width: "100%" }}
                        customDarkSquareStyle={{
                            backgroundColor: theme`colors.slate.600`,
                        }}
                        customLightSquareStyle={{
                            backgroundColor: theme`colors.slate.400`,
                        }}
                        customPieces={customPieces}
                        id={`${id}_board`}
                        isDraggablePiece={() => !!onMove}
                        onPieceDragBegin={(_, square) => {
                            onSquareSelect?.(square);
                        }}
                        onSquareClick={onSquareSelect}
                        onSquareRightClick={onSquareSelect}
                        onPieceDrop={onDrop}
                        position={game.fen()}
                    />
                </ChessBoardContext.Provider>
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
