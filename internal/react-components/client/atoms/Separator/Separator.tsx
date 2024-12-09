import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixSeparator from "@radix-ui/react-separator";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export const Separator = forwardRef<ElementRef<typeof RadixSeparator.Root>, ComponentProps<typeof RadixSeparator.Root>>(
    (props, ref) => {
        const { className, orientation = "horizontal", decorative = true } = props;

        return (
            <RadixSeparator.Root
                {...props}
                ref={ref}
                decorative={decorative}
                orientation={orientation}
                className={cn(
                    "shrink-0 bg-border",
                    orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
                    className,
                )}
            />
        );
    },
);

Separator.displayName = RadixSeparator.Root.displayName;
