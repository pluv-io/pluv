import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { MdxHeader } from "./MdxHeader";

export type MdxH1Props = ComponentProps<"h1">;

export const MdxH1 = forwardRef<HTMLHeadingElement, MdxH1Props>((props, ref) => {
    const { className, ...restProps } = props;

    return <MdxHeader {...restProps} className={cn("text-3xl font-bold sm:text-5xl", className)} ref={ref} type="h1" />;
});

MdxH1.displayName = "MdxH1";
