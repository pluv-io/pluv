import { cn } from "@pluv-internal/utils";
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AlertDialogTitleProps = RadixAlertDialog.AlertDialogTitleProps;

export const AlertDialogTitle = forwardRef<ElementRef<typeof RadixAlertDialog.Title>, AlertDialogTitleProps>(
    ({ className, ...props }, ref) => {
        return <RadixAlertDialog.Title className={cn("text-lg font-semibold", className)} {...props} ref={ref} />;
    },
);

AlertDialogTitle.displayName = "AlertDialogTitle";
