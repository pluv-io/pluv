import { cn } from "@pluv-internal/utils";
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import type { VariantProps } from "class-variance-authority";
import type { ElementRef } from "react";
import { forwardRef } from "react";
import { buttonVariants } from "../../../either";

export type AlertDialogCancelProps = RadixAlertDialog.AlertDialogCancelProps & VariantProps<typeof buttonVariants>;

export const AlertDialogCancel = forwardRef<ElementRef<typeof RadixAlertDialog.Cancel>, AlertDialogCancelProps>(
    ({ className, size, variant = "outline", ...props }, ref) => {
        return (
            <RadixAlertDialog.Cancel
                className={cn(buttonVariants({ size, variant }), "mt-2 sm:mt-0", className)}
                {...props}
                ref={ref}
            />
        );
    },
);

AlertDialogCancel.displayName = "AlertDialogCancel";
