import { cn } from "@pluv-internal/utils";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DropdownMenuSubContentProps = ComponentPropsWithoutRef<typeof RadixDropdownMenu.SubContent>;

export const DropdownMenuSubContent = forwardRef<
    ElementRef<typeof RadixDropdownMenu.SubContent>,
    DropdownMenuSubContentProps
>(({ className, ...restProps }, ref) => {
    return (
        <RadixDropdownMenu.SubContent
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
                    shadow-lg
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
    );
});

DropdownMenuSubContent.displayName = "DropdownMenuSubContent";
