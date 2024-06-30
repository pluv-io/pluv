import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxUlProps = InferComponentProps<"ul">;

export const MdxUl = forwardRef<HTMLUListElement, MdxUlProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <ul {...restProps} className={cn("mb-4 list-inside list-disc pl-6", className)} ref={ref} />;
});

MdxUl.displayName = "MdxUl";
