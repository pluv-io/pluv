import { CheckIcon } from "@pluv-internal/react-icons";
import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixSelect from "@radix-ui/react-select";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type SelectItemProps = ComponentProps<typeof RadixSelect.Item>;

export const SelectItem = forwardRef<ElementRef<typeof RadixSelect.Item>, SelectItemProps>((props, ref) => {
    const { className, children, ...restProps } = props;

    return (
        <RadixSelect.Item
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    relative
                    flex
                    w-full
                    cursor-default
                    select-none
                    items-center
                    rounded-sm
                    py-1.5
                    pl-2
                    pr-8
                    text-sm outline-none
                    focus:bg-accent
                    focus:text-accent-foreground
                    data-[disabled]:pointer-events-none
                    data-[disabled]:opacity-50
                `,
                className,
            )}
        >
            <span className="absolute right-2 flex size-3.5 items-center justify-center">
                <RadixSelect.ItemIndicator>
                    <CheckIcon className="size-4" />
                </RadixSelect.ItemIndicator>
            </span>
            <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
        </RadixSelect.Item>
    );
});

SelectItem.displayName = "SelectItem";
