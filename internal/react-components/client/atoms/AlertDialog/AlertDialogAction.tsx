import { cn } from "@pluv-internal/utils";
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import type { VariantProps } from "class-variance-authority";
import type { ElementRef } from "react";
import { forwardRef } from "react";
import { buttonVariants } from "../../../either";

export type AlertDialogActionProps = RadixAlertDialog.AlertDialogActionProps & VariantProps<typeof buttonVariants>;

export const AlertDialogAction = forwardRef<ElementRef<typeof RadixAlertDialog.Action>, AlertDialogActionProps>(
    ({ className, size, variant, ...props }, ref) => {
        return (
            <RadixAlertDialog.Action
                className={cn(buttonVariants({ size, variant }), className)}
                {...props}
                ref={ref}
            />
        );
    },
);

AlertDialogAction.displayName = "AlertDialogAction";
