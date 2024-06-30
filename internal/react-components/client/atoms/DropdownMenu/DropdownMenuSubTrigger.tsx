import { ChevronRightIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DropdownMenuSubTriggerProps = ComponentPropsWithoutRef<typeof RadixDropdownMenu.SubTrigger> & {
    inset?: boolean;
};

export const DropdownMenuSubTrigger = forwardRef<
    ElementRef<typeof RadixDropdownMenu.SubTrigger>,
    DropdownMenuSubTriggerProps
>(({ className, inset, children, ...restProps }, ref) => {
    return (
        <RadixDropdownMenu.SubTrigger
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    flex
                    cursor-default
                    select-none
                    items-center
                    rounded-sm
                    px-2
                    py-1.5
                    text-sm
                    outline-none
                    focus:bg-accent
                    data-[state=open]:bg-accent
                `,
                inset && "pl-8",
                className,
            )}
        >
            {children}
            <ChevronRightIcon className="ml-auto size-4 shrink-0" />
        </RadixDropdownMenu.SubTrigger>
    );
});

DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";
