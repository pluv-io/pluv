import type {
    ComponentType,
    ElementType,
    ForwardedRef,
    LegacyRef,
} from "react";

export type InferComponentProps<T extends ElementType> =
    T extends ComponentType<infer U>
        ? U
        : T extends keyof JSX.IntrinsicElements
        ? JSX.IntrinsicElements[T] extends { ref?: LegacyRef<infer R> }
            ? Omit<JSX.IntrinsicElements[T], "ref"> & { ref?: ForwardedRef<R> }
            : JSX.IntrinsicElements[T]
        : Record<string, never>;

export type WithAsProp<T extends ElementType> = {
    as?: T;
} & InferComponentProps<T>;

export interface Coordinates {
    x: number;
    y: number;
}
