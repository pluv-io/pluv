import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixSelect from "@radix-ui/react-select";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type SelectLabelProps = ComponentProps<typeof RadixSelect.Label>;

export const SelectLabel = forwardRef<ElementRef<typeof RadixSelect.Label>, SelectLabelProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <RadixSelect.Label {...restProps} ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} />
    );
});

SelectLabel.displayName = "SelectLabel";
