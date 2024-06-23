import { cn } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type TooltipContentProps = RadixTooltip.TooltipContentProps;

export const TooltipContent = forwardRef<ElementRef<typeof RadixTooltip.Content>, TooltipContentProps>((props, ref) => {
    const { className, sideOffset = 4, ...restProps } = props;

    return (
        <RadixTooltip.Content
            ref={ref}
            {...restProps}
            sideOffset={sideOffset}
            className={cn(
                oneLine`
                    z-50
                    overflow-hidden
                    rounded-md
                    border
                    bg-tooltip
                    px-3
                    py-1.5
                    text-center
                    text-xs
                    text-tooltip-foreground
                    shadow-md
                    animate-in
                    fade-in-0
                    zoom-in-95
                    data-[state=closed]:animate-out
                    data-[state=closed]:fade-out-0
                    data-[state=closed]:zoom-out-95
                    data-[side=bottom]:slide-in-from-top-2
                    data-[side=left]:slide-in-from-right-2
                    data-[side=right]:slide-in-from-left-2
                    data-[side=top]:slide-in-from-bottom-2
                `,
                className,
            )}
        />
    );
});

TooltipContent.displayName = "TooltipContent";
