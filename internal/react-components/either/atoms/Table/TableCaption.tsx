import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type TableCaptionProps = ComponentProps<"caption">;

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <caption {...restProps} ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} />;
});

TableCaption.displayName = "TableCaption";
