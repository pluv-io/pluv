import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type MdxTableProps = ComponentProps<"table">;

export const MdxTable = forwardRef<HTMLTableElement, MdxTableProps>((props, ref) => {
    const { children, className, style, ...restProps } = props;

    return (
        <div
            className={cn(
                oneLine`
                    flex
                    w-full
                    items-stretch
                    overflow-hidden
                    rounded-md
                    border
                    border-solid
                    border-border
                `,
                className,
            )}
            style={style}
        >
            <table
                {...restProps}
                className={oneLine`
                    -m-[1px]
                    grow
                    bg-card
                    text-sm
                    [&_tbody]:border-border
                    [&_td]:border
                    [&_td]:border-inherit
                    [&_td]:p-2
                    [&_th]:border
                    [&_th]:border-inherit
                    [&_th]:p-2
                    [&_th]:font-medium
                    [&_th]:text-muted-foreground
                    [&_thead]:border-border
                    [&_thead_tr]:border-b-2
                    [&_thead_tr]:border-b-border
                    [&_tr]:border-border
                `}
                ref={ref}
            >
                {children}
            </table>
        </div>
    );
});

MdxTable.displayName = "MdxTable";
