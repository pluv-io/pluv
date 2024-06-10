import { XIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import * as RadixDialog from "@radix-ui/react-dialog";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";
import { DialogOverlay } from "./DialogOverlay";
import { DialogPortal } from "./DialogPortal";

export type DialogContentProps = ComponentPropsWithoutRef<typeof RadixDialog.Content>;

export const DialogContent = forwardRef<ElementRef<typeof RadixDialog.Content>, DialogContentProps>(
    ({ className, children, ...props }, ref) => (
        <DialogPortal>
            <DialogOverlay />
            <RadixDialog.Content
                ref={ref}
                className={cn(
                    oneLine`
                    bg-background
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
                    p-6
                    shadow-lg
                    duration-200
                    sm:rounded-lg md:w-full
                `,
                    className,
                )}
                {...props}
            >
                {children}
                <RadixDialog.Close
                    className={oneLine`
                    ring-offset-background
                    focus:ring-ring
                    data-[state=open]:bg-accent
                    data-[state=open]:text-muted-foreground
                    absolute
                    right-4
                    top-4
                    rounded-sm
                    opacity-70
                    transition-opacity
                    hover:opacity-100
                    focus:outline-none
                    focus:ring-2
                    focus:ring-offset-2
                    disabled:pointer-events-none
                `}
                >
                    <XIcon className="size-4" />
                    <span className="sr-only">Close</span>
                </RadixDialog.Close>
            </RadixDialog.Content>
        </DialogPortal>
    ),
);
DialogContent.displayName = RadixDialog.Content.displayName;
