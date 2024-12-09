import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { MdxHeader } from "./MdxHeader";

export type MdxH4Props = ComponentProps<"h4">;

export const MdxH4 = forwardRef<HTMLHeadingElement, MdxH4Props>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <MdxHeader {...restProps} className={cn("text-base font-semibold sm:text-lg", className)} ref={ref} type="h4" />
    );
});

MdxH4.displayName = "MdxH4";
