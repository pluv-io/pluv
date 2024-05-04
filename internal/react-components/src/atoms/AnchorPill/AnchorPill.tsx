import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";
import { NextLink } from "../NextLink";

export type AnchorPillProps = InferComponentProps<typeof NextLink>;

export const AnchorPill = forwardRef<HTMLAnchorElement, AnchorPillProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <NextLink
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    inline-flex
                    h-7
                    flex-row
                    items-center
                    rounded-full
                    bg-zinc-700/60
                    px-3
                    text-sm
                    transition-colors
                    duration-150
                    ease-in
                    [&[data-selected="true"]]:bg-zinc-700
                    [&[href]]:cursor-pointer
                    [&[href]]:hover:bg-zinc-700
                `,
                className,
            )}
        />
    );
});

AnchorPill.displayName = "AnchorPill";
