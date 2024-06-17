import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type TableCaptionProps = InferComponentProps<"caption">;

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>((props, ref) => {
    const { className, ...restProps } = props;

    return <caption {...restProps} ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} />;
});

TableCaption.displayName = "TableCaption";
