import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type AlertDialogFooterProps = InferComponentProps<"div">;

export const AlertDialogFooter = forwardRef<HTMLDivElement, AlertDialogFooterProps>(({ className, ...props }, ref) => {
    return (
        <div
            className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
            {...props}
            ref={ref}
        />
    );
});

AlertDialogFooter.displayName = "AlertDialogFooter";
