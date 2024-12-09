import { ChevronDownIcon } from "@pluv-internal/react-icons";
import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixSelect from "@radix-ui/react-select";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type SelectScrollDownButtonProps = ComponentProps<typeof RadixSelect.ScrollDownButton>;

export const SelectScrollDownButton = forwardRef<
    ElementRef<typeof RadixSelect.ScrollDownButton>,
    SelectScrollDownButtonProps
>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <RadixSelect.ScrollDownButton
            {...restProps}
            ref={ref}
            className={cn("flex cursor-default items-center justify-center py-1", className)}
        >
            <ChevronDownIcon />
        </RadixSelect.ScrollDownButton>
    );
});

SelectScrollDownButton.displayName = "SelectScrollDownButton";
