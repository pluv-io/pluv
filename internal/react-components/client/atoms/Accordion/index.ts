import { Accordion as BaseAccordion } from "./Accordion";
import { AccordionContent } from "./AccordionContent";
import { AccordionItem } from "./AccordionItem";
import { AccordionTrigger } from "./AccordionTrigger";

export type { AccordionProps } from "./Accordion";
export { AccordionContent } from "./AccordionContent";
export { AccordionItem } from "./AccordionItem";
export { AccordionTrigger } from "./AccordionTrigger";

export const Accordion = Object.assign(BaseAccordion, {
    Content: AccordionContent,
    Item: AccordionItem,
    Trigger: AccordionTrigger,
});
