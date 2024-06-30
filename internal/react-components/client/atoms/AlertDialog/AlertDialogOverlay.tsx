import { cn } from "@pluv-internal/utils";
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AlertDialogOverlayProps = RadixAlertDialog.AlertDialogOverlayProps;

export const AlertDialogOverlay = forwardRef<ElementRef<typeof RadixAlertDialog.Overlay>, AlertDialogOverlayProps>(
    ({ className, ...props }, ref) => {
        return (
            <RadixAlertDialog.Overlay
                className={cn(
                    oneLine`
                        fixed
                        inset-0
                        z-50
                        bg-black/80
                        data-[state=open]:animate-in
                        data-[state=closed]:animate-out
                        data-[state=closed]:fade-out-0
                        data-[state=open]:fade-in-0
                    `,
                    className,
                )}
                {...props}
                ref={ref}
            />
        );
    },
);

AlertDialogOverlay.displayName = "AlertDialogOverlay";
