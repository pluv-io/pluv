import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { Slot } from "@radix-ui/react-slot";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type PillProps = ComponentProps<"div"> & {
    asChild?: boolean;
};

export const Pill = forwardRef<HTMLDivElement, PillProps>((props, ref) => {
    const { asChild, className, ...restProps } = props;

    const Component = asChild ? Slot : "div";

    return (
        <Component
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    inline-flex
                    h-7
                    flex-row
                    items-center
                    rounded-full
                    bg-accent
                    px-3
                    text-sm
                    font-medium
                    transition-colors
                    duration-150
                    ease-in
                    [&[data-selected="true"]]:bg-primary
                    [&[data-selected="true"]]:text-primary-foreground
                    [&[href]]:cursor-pointer
                `,
                className,
            )}
        />
    );
});

Pill.displayName = "Pill";
