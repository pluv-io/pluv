import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxCodeProps = Omit<InferComponentProps<"code">, "ref">;

export const MdxCode = forwardRef<HTMLElement, MdxCodeProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <code
            {...restProps}
            className={cn("rounded-md border border-border bg-accent px-1 py-0.5 font-mono", className)}
            ref={ref}
        />
    );
});

MdxCode.displayName = "MdxCode";
