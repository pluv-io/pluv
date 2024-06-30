import { cn } from "@pluv-internal/utils";
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AlertDialogDescriptionProps = RadixAlertDialog.AlertDialogDescriptionProps;

export const AlertDialogDescription = forwardRef<
    ElementRef<typeof RadixAlertDialog.Description>,
    AlertDialogDescriptionProps
>(({ className, ...props }, ref) => {
    return (
        <RadixAlertDialog.Description className={cn("text-sm text-muted-foreground", className)} {...props} ref={ref} />
    );
});

AlertDialogDescription.displayName = "AlertDialogDescription";
