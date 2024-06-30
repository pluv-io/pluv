import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type TableFooterProps = InferComponentProps<"tfoot">;

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <tfoot
            {...restProps}
            ref={ref}
            className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
        />
    );
});

TableFooter.displayName = "TableFooter";
