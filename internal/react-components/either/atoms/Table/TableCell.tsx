import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type TableCellProps = InferComponentProps<"td">;

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <td
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    p-2
                    align-middle
                    [&:has([role=checkbox])]:pr-0
                    [&>[role=checkbox]]:translate-y-[2px]
                `,
                className,
            )}
        />
    );
});

TableCell.displayName = "TableCell";
