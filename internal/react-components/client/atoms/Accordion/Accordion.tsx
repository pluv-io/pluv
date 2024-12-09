import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixAccordion from "@radix-ui/react-accordion";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AccordionProps = ComponentProps<typeof RadixAccordion.Root>;

export const Accordion = forwardRef<ElementRef<typeof RadixAccordion.Root>, AccordionProps>(
    ({ className, ...props }, ref) => {
        return (
            <RadixAccordion.Root
                className={cn(
                    oneLine`
                        flex
                        flex-col
                        gap-1.5
                    `,
                    className,
                )}
                {...props}
                ref={ref}
            />
        );
    },
) as typeof RadixAccordion.Root;

Accordion.displayName = "Accordion";
