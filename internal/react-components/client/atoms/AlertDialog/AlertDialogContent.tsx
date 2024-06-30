import { cn } from "@pluv-internal/utils";
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";
import { AlertDialogOverlay } from "./AlertDialogOverlay";
import { AlertDialogPortal } from "./AlertDialogPortal";

export type AlertDialogContentProps = RadixAlertDialog.AlertDialogContentProps;

export const AlertDialogContent = forwardRef<ElementRef<typeof RadixAlertDialog.Content>, AlertDialogContentProps>(
    ({ className, ...props }, ref) => {
        return (
            <AlertDialogPortal>
                <AlertDialogOverlay />
                <RadixAlertDialog.Content
                    ref={ref}
                    className={cn(
                        oneLine`
                            fixed
                            left-[50%]
                            top-[50%]
                            z-50
                            grid
                            w-full
                            max-w-lg
                            translate-x-[-50%]
                            translate-y-[-50%]
                            gap-4
                            border
                            bg-background
                            p-6
                            shadow-lg
                            duration-200
                            data-[state=open]:animate-in
                            data-[state=closed]:animate-out
                            data-[state=closed]:fade-out-0
                            data-[state=open]:fade-in-0
                            data-[state=closed]:zoom-out-95
                            data-[state=open]:zoom-in-95
                            data-[state=closed]:slide-out-to-left-1/2
                            data-[state=closed]:slide-out-to-top-[48%]
                            data-[state=open]:slide-in-from-left-1/2
                            data-[state=open]:slide-in-from-top-[48%]
                            sm:rounded-lg
                        `,
                        className,
                    )}
                    {...props}
                />
            </AlertDialogPortal>
        );
    },
);

AlertDialogContent.displayName = "AlertDialogContent";
