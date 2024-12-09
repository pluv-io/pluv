import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type MdxBlockQuoteProps = Omit<ComponentProps<"blockquote">, "ref">;

export const MdxBlockQuote = forwardRef<HTMLQuoteElement, MdxBlockQuoteProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <blockquote
            {...restProps}
            className={cn(
                oneLine`
                    mb-[1.2em]
                    border-l-2
                    border-solid
                    border-primary
                    py-1
                    pl-3
                    [&>p]:my-0
                `,
                className,
            )}
            ref={ref}
        />
    );
});

MdxBlockQuote.displayName = "MdxBlockQuote";
