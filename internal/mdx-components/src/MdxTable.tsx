import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type MdxTableProps = InferComponentProps<"table">;

export const MdxTable = forwardRef<HTMLTableElement, MdxTableProps>((props, ref) => {
    const { children, className, style, ...restProps } = props;

    return (
        <div
            className={cn(
                "flex w-full items-stretch overflow-hidden rounded-md border border-solid border-indigo-500/40",
                className,
            )}
            style={style}
        >
            <table
                {...restProps}
                className={oneLine`
                    -m-[1px]
                    grow
                    [&_tbody]:border-indigo-500/40
                    [&_td]:border
                    [&_td]:border-inherit
                    [&_td]:p-2
                    [&_th]:border
                    [&_th]:border-inherit
                    [&_th]:p-2
                    [&_thead]:border-indigo-500/40
                    [&_thead]:bg-zinc-800
                    [&_thead_tr]:border-b-2
                    [&_thead_tr]:border-b-indigo-500
                    [&_tr:nth-child(2n)]:bg-zinc-800
                    [&_tr]:border-indigo-500/40        
                `}
                ref={ref}
            >
                {children}
            </table>
        </div>
    );
});

MdxTable.displayName = "MdxTable";
