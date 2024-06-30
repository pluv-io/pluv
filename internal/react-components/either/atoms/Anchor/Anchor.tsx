import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import NextLink from "next/link";
import { forwardRef } from "react";

export type AnchorProps = InferComponentProps<typeof NextLink>;

export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>((props, ref) => {
    const { as: _as, className, href, ...restProps } = props;

    return (
        <NextLink
            {...restProps}
            className={cn(
                oneLine`
                    cursor-pointer
                    whitespace-pre
                    font-sans
                    font-medium
                    text-foreground
                    underline-offset-4
                    hover:text-sky-600
                    hover:underline
                `,
                className,
            )}
            as={_as as string}
            href={href as string}
            ref={ref}
        />
    );
});

Anchor.displayName = "Anchor";
