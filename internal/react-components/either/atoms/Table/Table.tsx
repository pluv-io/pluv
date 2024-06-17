import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type TableProps = InferComponentProps<"table">;

export const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <div className="relative w-full overflow-auto">
            <table {...restProps} ref={ref} className={cn("w-full caption-bottom text-sm", className)} />
        </div>
    );
});

Table.displayName = "Table";
