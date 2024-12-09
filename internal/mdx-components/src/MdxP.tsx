import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxPProps = ComponentProps<"p">;

export const MdxP = forwardRef<HTMLParagraphElement, MdxPProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <p {...restProps} className={cn("my-[0.8em]", className)} ref={ref} />;
});

MdxP.displayName = "MdxP";
