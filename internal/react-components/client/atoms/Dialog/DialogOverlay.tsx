import { cn } from "@pluv-internal/utils";
import * as RadixDialog from "@radix-ui/react-dialog";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DialogOverlayProps = ComponentPropsWithoutRef<typeof RadixDialog.Overlay>;

export const DialogOverlay = forwardRef<ElementRef<typeof RadixDialog.Overlay>, DialogOverlayProps>(
    ({ className, ...props }, ref) => (
        <RadixDialog.Overlay
            ref={ref}
            className={cn(
                oneLine`
                bg-background/80
                data-[state=open]:animate-in
                data-[state=closed]:animate-out
                data-[state=closed]:fade-out-0
                data-[state=open]:fade-in-0
                fixed
                inset-0
                z-50
                backdrop-blur-sm
            `,
                className,
            )}
            {...props}
        />
    ),
);

DialogOverlay.displayName = RadixDialog.Overlay.displayName;
