import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxLiProps = ComponentProps<"li">;

export const MdxLi = forwardRef<HTMLLIElement, MdxLiProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <li {...restProps} className={cn("mb-1 [&>ol]:mt-1 [&>ul]:mt-1", className)} ref={ref} />;
});

MdxLi.displayName = "MdxLi";
