import { CircleIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DropdownMenuRadioItemProps = ComponentPropsWithoutRef<typeof RadixDropdownMenu.RadioItem>;

export const DropdownMenuRadioItem = forwardRef<
    ElementRef<typeof RadixDropdownMenu.RadioItem>,
    DropdownMenuRadioItemProps
>(({ className, children, ...restProps }, ref) => {
    return (
        <RadixDropdownMenu.RadioItem
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    relative
                    flex
                    cursor-default
                    select-none
                    items-center
                    rounded-sm
                    py-1.5
                    pl-8
                    pr-2
                    text-sm
                    outline-none
                    transition-colors
                    focus:bg-accent
                    focus:text-accent-foreground
                    data-[disabled]:pointer-events-none
                    data-[disabled]:opacity-50
                `,
                className,
            )}
        >
            <span className="absolute left-2 flex size-3.5 items-center justify-center">
                <RadixDropdownMenu.ItemIndicator>
                    <CircleIcon className="size-2 shrink-0 fill-current" />
                </RadixDropdownMenu.ItemIndicator>
            </span>
            {children}
        </RadixDropdownMenu.RadioItem>
    );
});

DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";
