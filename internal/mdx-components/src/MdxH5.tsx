import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";
import { MdxHeader } from "./MdxHeader";

export type MdxH5Props = InferComponentProps<"h5">;

export const MdxH5 = forwardRef<HTMLHeadingElement, MdxH5Props>((props, ref) => {
    const { className, ...restProps } = props;

    return <MdxHeader {...restProps} className={cn("text-base font-semibold", className)} ref={ref} type="h5" />;
});

MdxH5.displayName = "MdxH5";
