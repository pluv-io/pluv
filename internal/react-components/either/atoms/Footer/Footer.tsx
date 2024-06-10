import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type FooterProps = InferComponentProps<"footer">;

export const Footer = forwardRef<HTMLElement, FooterProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <footer
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    mt-auto
                    h-24
                    w-full
                    border-t
                    border-solid
                    border-indigo-700/60
                    bg-zinc-800
                    px-4
                    shadow-lg
                    shadow-indigo-800
                `,
                className,
            )}
        />
    );
});

Footer.displayName = "Footer";
