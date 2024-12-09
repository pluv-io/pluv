import { ChevronDownIcon } from "@pluv-internal/react-icons";
import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixSelect from "@radix-ui/react-select";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type SelectScrollUpButtonProps = ComponentProps<typeof RadixSelect.ScrollUpButton>;

export const SelectScrollUpButton = forwardRef<
    ElementRef<typeof RadixSelect.ScrollUpButton>,
    SelectScrollUpButtonProps
>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <RadixSelect.ScrollUpButton
            {...restProps}
            ref={ref}
            className={cn("flex cursor-default items-center justify-center py-1", className)}
        >
            <ChevronDownIcon className="rotate-180" />
        </RadixSelect.ScrollUpButton>
    );
});

SelectScrollUpButton.displayName = "SelectScrollUpButton";
