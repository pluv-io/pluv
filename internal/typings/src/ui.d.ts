import type { ComponentProps, ElementType } from "react";

export type WithAsProp<T extends ElementType> = {
    as?: T;
} & ComponentProps<T>;
