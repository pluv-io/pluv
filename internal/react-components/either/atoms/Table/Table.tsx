import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type TableProps = ComponentProps<"table">;

export const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <div className={cn("relative w-full overflow-auto", className)}>
            <table {...restProps} ref={ref} className={"w-full caption-bottom text-sm"} />
        </div>
    );
});

Table.displayName = "Table";
