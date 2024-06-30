import { ChevronRightIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import * as RadixAccordion from "@radix-ui/react-accordion";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AccordionTriggerProps = RadixAccordion.AccordionTriggerProps;

export const AccordionTrigger = forwardRef<ElementRef<typeof RadixAccordion.Trigger>, AccordionTriggerProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <RadixAccordion.Header className="flex">
                <RadixAccordion.Trigger
                    ref={ref}
                    className={cn(
                        oneLine`
                            flex
                            flex-1
                            items-center
                            justify-start
                            gap-1.5
                            p-2
                            text-sm
                            font-medium
                            text-foreground/60
                            transition-all
                            duration-100
                            ease-in
                            hover:text-foreground
                            data-[state=open]:text-foreground
                            [&[data-state=open]>svg]:rotate-90
                        `,
                        className,
                    )}
                    {...props}
                >
                    <ChevronRightIcon
                        className={oneLine`
                            size-4
                            shrink-0
                            text-muted-foreground
                            transition-transform
                            duration-150
                        `}
                    />
                    {children}
                </RadixAccordion.Trigger>
            </RadixAccordion.Header>
        );
    },
);

AccordionTrigger.displayName = "AccordionTrigger";
