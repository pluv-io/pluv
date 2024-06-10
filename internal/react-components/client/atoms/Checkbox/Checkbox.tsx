import { CheckIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type CheckboxProps = ComponentPropsWithoutRef<typeof RadixCheckbox.Root>;

export const Checkbox = forwardRef<ElementRef<typeof RadixCheckbox.Root>, CheckboxProps>(
    ({ className, ...props }, ref) => (
        <RadixCheckbox.Root
            ref={ref}
            className={cn(
                oneLine`
                peer
                h-4
                w-4
                shrink-0
                rounded-sm
                border
                border-primary
                ring-offset-background
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
                focus-visible:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-50
                data-[state=checked]:bg-primary
                data-[state=checked]:text-primary-foreground
            `,
                className,
            )}
            {...props}
        >
            <RadixCheckbox.Indicator className={cn("flex items-center justify-center text-current")}>
                <CheckIcon className="size-4" />
            </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>
    ),
);

Checkbox.displayName = RadixCheckbox.Root.displayName;
