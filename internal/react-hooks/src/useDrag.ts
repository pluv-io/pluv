import { MouseEvent, RefCallback, useMemo } from "react";
import { useState, useEffect, useCallback } from "react";

export interface UseDragOptions<TElement extends HTMLElement> {
    onDrag: (delta: { x: number; y: number }, e: MouseEvent<TElement>) => void;
}

export interface UseDragHandlers<TElement extends HTMLElement> {
    onMouseDown: (e: MouseEvent<TElement>) => void;
    onMouseUp: (e: MouseEvent<TElement>) => void;
    onMouseMove: (e: MouseEvent<TElement>) => void;
}

export interface UseDragResult<TElement extends HTMLElement> {
    handlers: UseDragHandlers<TElement>;
    isDragging: boolean;
    ref: RefCallback<TElement | null>;
}

export const useDrag = <TElement extends HTMLElement>(
    options: UseDragOptions<TElement>,
    elem: TElement | null = null
): UseDragResult<TElement> => {
    const { onDrag } = options;

    const [_elem, ref] = useState<TElement | null>(elem);
    const finalElem = elem ?? _elem;

    const [start, setStart] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const isDragging = !!start;

    const onMouseDown = useCallback((e: MouseEvent<TElement>) => {
        setStart({ x: e.pageX, y: e.pageY });
    }, []);

    const onMouseUp = useCallback(() => {
        setStart(null);
    }, []);

    const onMouseMove = useCallback(
        (e: MouseEvent<TElement>) => {
            if (!start) return;

            const delta = {
                x: start.x - e.pageX,
                y: start.y - e.pageY,
            };

            onDrag(delta, e);
        },
        [onDrag, start]
    );

    useEffect(() => {
        if (!finalElem) return;

        finalElem.addEventListener("pointerdown", onMouseDown as any);
        finalElem.addEventListener("pointermove", onMouseMove as any);
        finalElem.addEventListener("pointerup", onMouseUp);

        return () => {
            finalElem.removeEventListener("mousedown", onMouseDown as any);
            finalElem.removeEventListener("mousemove", onMouseMove as any);
            finalElem.removeEventListener("mouseup", onMouseUp);
        };
    }, [finalElem, onMouseDown, onMouseMove, onMouseUp, isDragging]);

    const handlers = useMemo(
        () => ({ onMouseDown, onMouseMove, onMouseUp }),
        [onMouseDown, onMouseMove, onMouseUp]
    );

    return { handlers, isDragging, ref };
};
