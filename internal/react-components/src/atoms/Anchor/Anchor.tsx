import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";
import { NextLink } from "../NextLink";

export type AnchorProps = InferComponentProps<typeof NextLink>;

export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <NextLink
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    transition-colors
                    duration-75
                    ease-in
                    hover:text-sky-500
                    hover:underline
                    [&[data-selected="true"]]:text-sky-500
                `,
                className,
            )}
        />
    );
});

Anchor.displayName = "Anchor";
