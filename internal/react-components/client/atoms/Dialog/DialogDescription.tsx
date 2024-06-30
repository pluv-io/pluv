import { cn } from "@pluv-internal/utils";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DialogDescriptionProps = ComponentPropsWithoutRef<typeof RadixDialog.Description>;

export const DialogDescription = forwardRef<ElementRef<typeof RadixDialog.Description>, DialogDescriptionProps>(
    ({ className, ...props }, ref) => (
        <RadixDialog.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
    ),
);

DialogDescription.displayName = RadixDialog.Description.displayName;
