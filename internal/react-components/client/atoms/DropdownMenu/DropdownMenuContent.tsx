import { cn } from "@pluv-internal/utils";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DropdownMenuContentProps = ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content>;

export const DropdownMenuContent = forwardRef<ElementRef<typeof RadixDropdownMenu.Content>, DropdownMenuContentProps>(
    ({ className, collisionPadding = 4, sideOffset = 4, ...restProps }, ref) => {
        return (
            <RadixDropdownMenu.Portal>
                <RadixDropdownMenu.Content
                    collisionPadding={collisionPadding}
                    sideOffset={sideOffset}
                    {...restProps}
                    ref={ref}
                    className={cn(
                        oneLine`
                            z-50
                            min-w-[8rem]
                            overflow-hidden
                            rounded-md
                            border
                            bg-popover
                            p-1
                            text-popover-foreground
                            shadow-md
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
                />
            </RadixDropdownMenu.Portal>
        );
    },
);

DropdownMenuContent.displayName = "DropdownMenuContent";
