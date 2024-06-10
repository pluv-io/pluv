import { cn } from "@pluv-internal/utils";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DropdownMenuLabelProps = ComponentPropsWithoutRef<typeof RadixDropdownMenu.Label> & {
    inset?: boolean;
};

export const DropdownMenuLabel = forwardRef<ElementRef<typeof RadixDropdownMenu.Label>, DropdownMenuLabelProps>(
    ({ className, inset, ...restProps }, ref) => {
        return (
            <RadixDropdownMenu.Label
                {...restProps}
                ref={ref}
                className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
            />
        );
    },
);

DropdownMenuLabel.displayName = "DropdownMenuLabel";
