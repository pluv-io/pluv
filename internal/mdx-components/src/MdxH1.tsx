import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { MdxHeader } from "./MdxHeader";

export type MdxH1Props = InferComponentProps<"h1">;

export const MdxH1 = forwardRef<HTMLHeadingElement, MdxH1Props>((props, ref) => {
    const { className, ...restProps } = props;

    return <MdxHeader {...restProps} className={cn("text-5xl font-bold", className)} ref={ref} type="h1" />;
});

MdxH1.displayName = "MdxH1";
