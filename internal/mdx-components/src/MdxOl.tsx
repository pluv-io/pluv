import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxOlProps = ComponentProps<"ol">;

export const MdxOl = forwardRef<HTMLOListElement, MdxOlProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <ol {...restProps} className={cn("mb-4 list-inside list-decimal pl-6", className)} ref={ref} />;
});

MdxOl.displayName = "MdxOl";
