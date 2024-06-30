import { cn } from "@pluv-internal/utils";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator>;

export const DropdownMenuSeparator = forwardRef<
    ElementRef<typeof RadixDropdownMenu.Separator>,
    DropdownMenuSeparatorProps
>(({ className, ...restProps }, ref) => {
    return (
        <RadixDropdownMenu.Separator {...restProps} ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} />
    );
});

DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
