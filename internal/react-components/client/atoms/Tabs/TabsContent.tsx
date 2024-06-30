import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixTabs from "@radix-ui/react-tabs";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type TabsContentProps = InferComponentProps<typeof RadixTabs.Content>;

export const TabsContent = forwardRef<ElementRef<typeof RadixTabs.Content>, TabsContentProps>((props, ref) => {
    const { className, ...restProps } = props;

    return (
        <RadixTabs.Content
            {...restProps}
            ref={ref}
            className={cn(
                oneLine`
                    mt-2
                    ring-offset-background
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
                `,
                className,
            )}
        />
    );
});

TabsContent.displayName = "TabsContent";
