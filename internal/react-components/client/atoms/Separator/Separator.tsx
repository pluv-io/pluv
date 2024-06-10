import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixSeparator from "@radix-ui/react-separator";
import * as React from "react";

export const Separator = React.forwardRef<
    React.ElementRef<typeof RadixSeparator.Root>,
    InferComponentProps<typeof RadixSeparator.Root>
>((props, ref) => {
    const { className, orientation = "horizontal", decorative = true } = props;

    return (
        <RadixSeparator.Root
            {...props}
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className={cn(
                "bg-border shrink-0",
                orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
                className,
            )}
        />
    );
});

Separator.displayName = RadixSeparator.Root.displayName;
