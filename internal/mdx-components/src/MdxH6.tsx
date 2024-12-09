import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { MdxHeader } from "./MdxHeader";

export type MdxH6Props = ComponentProps<"h6">;

export const MdxH6 = forwardRef<HTMLHeadingElement, MdxH6Props>((props, ref) => {
    const { className, ...restProps } = props;

    return <MdxHeader {...restProps} className={cn("text-xs font-semibold", className)} ref={ref} type="h6" />;
});

MdxH6.displayName = "MdxH6";
