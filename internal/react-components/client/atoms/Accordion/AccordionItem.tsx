import { cn } from "@pluv-internal/utils";
import * as RadixAccordion from "@radix-ui/react-accordion";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AccordionItemProps = RadixAccordion.AccordionItemProps;

export const AccordionItem = forwardRef<ElementRef<typeof RadixAccordion.Item>, AccordionItemProps>(
    ({ className, ...props }, ref) => {
        return (
            <RadixAccordion.Item
                ref={ref}
                className={cn(
                    oneLine`
                        rounded-md
                        border
                        border-solid
                        border-border
                        transition-colors
                        duration-100
                        ease-in
                        [&[data-state=open]:focus-within]:border-foreground
                    `,
                    className,
                )}
                {...props}
            />
        );
    },
);

AccordionItem.displayName = "AccordionItem";
