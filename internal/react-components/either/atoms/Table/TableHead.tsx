import { cn } from "@pluv-internal/utils";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

export type TableHeadProps = ComponentProps<"th">;

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <th
            {...restProps}
            ref={ref}
            className={cn(
                "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                className,
            )}
        />
    );
});

TableHead.displayName = "TableHead";
