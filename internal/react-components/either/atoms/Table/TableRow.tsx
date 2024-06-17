import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type TableRowProps = InferComponentProps<"tr">;

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <tr
            {...restProps}
            ref={ref}
            className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
        />
    );
});

TableRow.displayName = "TableRow";
