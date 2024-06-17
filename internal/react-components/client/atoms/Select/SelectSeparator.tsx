import { ChevronUpDownIcon } from "@pluv-internal/react-icons";
import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixSelect from "@radix-ui/react-select";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type SelectSeparatorProps = InferComponentProps<typeof RadixSelect.Separator>;

export const SelectSeparator = forwardRef<ElementRef<typeof RadixSelect.Separator>, SelectSeparatorProps>(
    (props, ref) => {
        const { className, ...restProps } = props;

        return <RadixSelect.Separator {...restProps} ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} />;
    },
);

SelectSeparator.displayName = RadixSelect.Separator.displayName;
