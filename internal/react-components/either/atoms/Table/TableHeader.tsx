import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type TableHeaderProps = InferComponentProps<"thead">;

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <thead {...restProps} ref={ref} className={cn("[&_tr]:border-b", className)} />;
});

TableHeader.displayName = "TableHeader";
