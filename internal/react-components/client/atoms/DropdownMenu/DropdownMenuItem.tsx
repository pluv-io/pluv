import { cn } from "@pluv-internal/utils";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item> & {
    inset?: boolean;
};

export const DropdownMenuItem = forwardRef<ElementRef<typeof RadixDropdownMenu.Item>, DropdownMenuItemProps>(
    ({ className, inset, ...props }, ref) => {
        return (
            <RadixDropdownMenu.Item
                ref={ref}
                className={cn(
                    oneLine`
                        relative
                        flex
                        cursor-pointer
                        select-none
                        items-center
                        gap-y-1.5
                        rounded-sm
                        px-2
                        py-1.5
                        text-sm
                        outline-none
                        transition-colors
                        focus:bg-accent
                        focus:text-accent-foreground
                        data-[disabled]:pointer-events-none
                        data-[disabled]:opacity-50
                    `,
                    inset && "pl-8",
                    className,
                )}
                {...props}
            />
        );
    },
);

DropdownMenuItem.displayName = "DropdownMenuItem";
