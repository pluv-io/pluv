import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type TypistCursorProps = InferComponentProps<"span">;

export const TypistCursor = forwardRef<HTMLSpanElement, TypistCursorProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <span
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    animate-[blink_1s_linear_infinite]
                    text-[0.84em]
                    font-medium
                    opacity-100
                `,
                className,
            )}
        >
            {"|"}
        </span>
    );
});

TypistCursor.displayName = "TypistCursor";
