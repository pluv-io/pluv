import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxBlockQuoteProps = Omit<InferComponentProps<"blockquote">, "ref">;

export const MdxBlockQuote = forwardRef<HTMLQuoteElement, MdxBlockQuoteProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <blockquote
            {...restProps}
            className={cn("mb-[1.2em] border-l-2 border-solid border-indigo-500 py-1 pl-3 [&>p]:my-0", className)}
            ref={ref}
        />
    );
});

MdxBlockQuote.displayName = "MdxBlockQuote";
