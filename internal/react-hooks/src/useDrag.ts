import { MouseEvent, RefCallback, useMemo } from "react";
import { useState, useEffect, useCallback } from "react";

export interface UseDragOptions<TElement extends HTMLElement> {
    container?: HTMLElement;
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
    const { container, onDrag } = options;

    const [_elem, ref] = useState<TElement | null>(elem);
    const finalElem = elem ?? _elem;

    const [start, setStart] = useState<{ x: number; y: number } | null>(null);

    const isDragging = !!start;

    const onMouseDown = useCallback((e: MouseEvent) => {
        setStart({ x: e.pageX, y: e.pageY });
    }, []);

    const onMouseUp = useCallback(() => {
        setStart(null);
    }, []);

    const onMouseMove = useCallback(
        (e: MouseEvent) => {
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

        const _container = container ?? window;

        finalElem.addEventListener("mousedown", onMouseDown as any);
        _container.addEventListener("mouseup", onMouseUp);
        _container.addEventListener("mousemove", onMouseMove as any);

        return () => {
            finalElem.removeEventListener("mousedown", onMouseDown as any);
            _container.removeEventListener("mouseup", onMouseUp);
            _container.removeEventListener("mousemove", onMouseMove as any);
        };
    }, [container, finalElem, onMouseDown, onMouseMove, onMouseUp, isDragging]);

    const handlers = useMemo(
        () => ({ onMouseDown, onMouseMove, onMouseUp }),
        [onMouseDown, onMouseMove, onMouseUp]
    );

    return { handlers, isDragging, ref };
};
