import { cn } from "@pluv-internal/utils";
import * as RadixLabel from "@radix-ui/react-label";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type LabelProps = ComponentPropsWithoutRef<typeof RadixLabel.Root>;

export const Label = forwardRef<ElementRef<typeof RadixLabel.Root>, LabelProps>(({ className, ...props }, ref) => (
    <RadixLabel.Root
        ref={ref}
        className={cn(
            oneLine`
                    flex
                    items-center
                    gap-1
                    text-sm
                    font-medium
                    leading-none
                    peer-disabled:cursor-not-allowed
                    peer-disabled:opacity-70
                `,
            className,
        )}
        {...props}
    />
));

Label.displayName = RadixLabel.Root.displayName;
