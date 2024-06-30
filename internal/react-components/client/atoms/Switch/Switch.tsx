import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixSwitch from "@radix-ui/react-switch";
import { oneLine } from "common-tags";
import { ElementRef, forwardRef } from "react";

export const Switch = forwardRef<ElementRef<typeof RadixSwitch.Root>, InferComponentProps<typeof RadixSwitch.Root>>(
    (props, ref) => {
        return (
            <RadixSwitch.Root
                className={cn(
                    oneLine`
                    peer
                    inline-flex
                    h-6
                    w-11
                    shrink-0
                    cursor-pointer
                    items-center
                    rounded-full
                    border-2
                    border-transparent
                    transition-colors
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-background
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    data-[state=checked]:bg-primary
                    data-[state=unchecked]:bg-input
                `,
                    props.className,
                )}
                {...props}
                ref={ref}
            >
                <RadixSwitch.Thumb
                    className={cn(
                        oneLine`
                        pointer-events-none
                        block
                        h-5
                        w-5
                        rounded-full
                        bg-background
                        shadow-lg
                        ring-0
                        transition-transform
                        data-[state=checked]:translate-x-5
                        data-[state=unchecked]:translate-x-0
                    `,
                    )}
                />
            </RadixSwitch.Root>
        );
    },
);

Switch.displayName = RadixSwitch.Root.displayName;
