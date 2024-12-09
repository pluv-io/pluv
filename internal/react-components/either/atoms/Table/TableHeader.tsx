import { cn } from "@pluv-internal/utils";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

export type TableHeaderProps = ComponentProps<"thead">;

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <thead {...restProps} ref={ref} className={cn("[&_tr]:border-b", className)} />;
});

TableHeader.displayName = "TableHeader";
