import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type MdxCodeProps = Omit<InferComponentProps<"code">, "ref">;

export const MdxCode = forwardRef<HTMLElement, MdxCodeProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <code
            className={cn("rounded-md border border-indigo-500/40 bg-zinc-800 p-0.5 font-mono", className)}
            ref={ref}
        />
    );
});

MdxCode.displayName = "MdxCode";
