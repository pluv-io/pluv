import { cn } from "@pluv-internal/utils";
import * as RadixAccordion from "@radix-ui/react-accordion";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AccordionContentProps = RadixAccordion.AccordionContentProps;

export const AccordionContent = forwardRef<ElementRef<typeof RadixAccordion.Content>, AccordionContentProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <RadixAccordion.Content
                ref={ref}
                className={oneLine`
                    overflow-hidden
                    text-sm
                    data-[state=closed]:animate-accordion-up
                    data-[state=open]:animate-accordion-down
                `}
                {...props}
            >
                <div className={cn("p-2", className)}>{children}</div>
            </RadixAccordion.Content>
        );
    },
);

AccordionContent.displayName = "AccordionContent";
