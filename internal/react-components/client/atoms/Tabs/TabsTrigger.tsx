import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixTabs from "@radix-ui/react-tabs";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type TabsTriggerProps = InferComponentProps<typeof RadixTabs.Trigger>;

export const TabsTrigger = forwardRef<ElementRef<typeof RadixTabs.Trigger>, TabsTriggerProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <RadixTabs.Trigger
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    inline-flex
                    items-center
                    justify-center
                    whitespace-nowrap
                    rounded-md
                    px-3
                    py-1
                    text-sm
                    font-medium
                    ring-offset-background
                    transition-all
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
                    disabled:pointer-events-none
                    disabled:opacity-50
                    data-[state=active]:bg-background
                    data-[state=active]:text-foreground
                    data-[state=active]:shadow
                `,
                className,
            )}
        />
    );
});

TabsTrigger.displayName = "TabsTrigger";
