import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type PaperProps = InferComponentProps<"div">;

export const Paper = forwardRef<HTMLDivElement, PaperProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <div
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    block
                    rounded
                    border
                    border-solid
                    border-transparent
                    bg-zinc-800
                    shadow-2xl
                    transition
                    duration-150
                    ease-in
                    [&[href]]:cursor-pointer
                    [&[href]]:hover:border-sky-500
                `,
                className,
            )}
        />
    );
});

Paper.displayName = "Paper";
