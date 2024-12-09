import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type AlertDialogHeaderProps = ComponentProps<"div">;

export const AlertDialogHeader = forwardRef<HTMLDivElement, AlertDialogHeaderProps>(({ className, ...props }, ref) => {
    return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} ref={ref} />;
});

AlertDialogHeader.displayName = "AlertDialogHeader";
