import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { MdxHeader } from "./MdxHeader";

export type MdxH2Props = InferComponentProps<"h2">;

export const MdxH2 = forwardRef<HTMLHeadingElement, MdxH2Props>((props, ref) => {
    const { className, ...restProps } = props;

    return <MdxHeader {...restProps} className={cn("text-3xl font-bold", className)} ref={ref} type="h2" />;
});

MdxH2.displayName = "MdxH2";
