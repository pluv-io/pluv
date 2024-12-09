import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxUlProps = ComponentProps<"ul">;

export const MdxUl = forwardRef<HTMLUListElement, MdxUlProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <ul {...restProps} className={cn("mb-4 list-inside list-disc pl-6", className)} ref={ref} />;
});

MdxUl.displayName = "MdxUl";
