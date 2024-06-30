import { ChevronUpDownIcon } from "@pluv-internal/react-icons";
import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixSelect from "@radix-ui/react-select";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type SelectTriggerProps = InferComponentProps<typeof RadixSelect.Trigger>;

export const SelectTrigger = forwardRef<ElementRef<typeof RadixSelect.Trigger>, SelectTriggerProps>((props, ref) => {
    const { className, children, ...restProps } = props;

    return (
        <RadixSelect.Trigger
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    flex
                    h-9
                    w-full
                    items-center
                    justify-between
                    whitespace-nowrap
                    rounded-md
                    border
                    border-input
                    bg-transparent
                    px-3
                    py-2
                    text-sm
                    shadow-sm
                    ring-offset-background
                    placeholder:text-muted-foreground
                    focus:outline-none
                    focus:ring-1
                    focus:ring-ring
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    [&>span]:line-clamp-1
                `,
                className,
            )}
        >
            {children}
            <RadixSelect.Icon asChild>
                <ChevronUpDownIcon className="size-4 opacity-50" />
            </RadixSelect.Icon>
        </RadixSelect.Trigger>
    );
});

SelectTrigger.displayName = "SelectTrigger";
