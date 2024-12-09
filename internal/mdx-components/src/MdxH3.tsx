import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { MdxHeader } from "./MdxHeader";

export type MdxH3Props = ComponentProps<"h3">;

export const MdxH3 = forwardRef<HTMLHeadingElement, MdxH3Props>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <MdxHeader
            {...restProps}
            className={cn("text-lg font-bold sm:text-xl md:text-2xl", className)}
            ref={ref}
            type="h3"
        />
    );
});

MdxH3.displayName = "MdxH3";
