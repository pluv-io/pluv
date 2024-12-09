import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixTabs from "@radix-ui/react-tabs";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type TabsListProps = ComponentProps<typeof RadixTabs.List>;

export const TabsList = forwardRef<ElementRef<typeof RadixTabs.List>, TabsListProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <RadixTabs.List
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    inline-flex
                    h-9
                    items-center
                    justify-center
                    rounded-lg
                    bg-muted
                    p-1
                    text-muted-foreground
                `,
                className,
            )}
        />
    );
});

TabsList.displayName = "TabsList";
