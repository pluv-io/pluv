import { cn } from "@pluv-internal/utils";
import * as RadixPopover from "@radix-ui/react-popover";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type PopoverContentProps = ComponentPropsWithoutRef<typeof RadixPopover.Content>;

export const PopoverContent = forwardRef<ElementRef<typeof RadixPopover.Content>, PopoverContentProps>(
    ({ className, align = "center", collisionPadding = 4, sideOffset = 4, ...props }, ref) => (
        <RadixPopover.Portal>
            <RadixPopover.Content
                ref={ref}
                align={align}
                collisionPadding={collisionPadding}
                sideOffset={sideOffset}
                className={cn(
                    oneLine`
                    z-50
                    w-72
                    rounded-md
                    border
                    bg-popover
                    p-4
                    text-popover-foreground
                    shadow-md
                    outline-none
                    data-[state=open]:animate-in
                    data-[state=closed]:animate-out
                    data-[state=closed]:fade-out-0
                    data-[state=open]:fade-in-0
                    data-[state=closed]:zoom-out-95
                    data-[state=open]:zoom-in-95
                    data-[side=bottom]:slide-in-from-top-2
                    data-[side=left]:slide-in-from-right-2
                    data-[side=right]:slide-in-from-left-2
                    data-[side=top]:slide-in-from-bottom-2
                `,
                    className,
                )}
                {...props}
            />
        </RadixPopover.Portal>
    ),
);

PopoverContent.displayName = RadixPopover.Content.displayName;