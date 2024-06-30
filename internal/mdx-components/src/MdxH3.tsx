import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { MdxHeader } from "./MdxHeader";

export type MdxH3Props = InferComponentProps<"h3">;

export const MdxH3 = forwardRef<HTMLHeadingElement, MdxH3Props>((props, ref) => {
    const { className, ...restProps } = props;

    return <MdxHeader {...restProps} className={cn("text-2xl font-bold", className)} ref={ref} type="h3" />;
});

MdxH3.displayName = "MdxH3";
