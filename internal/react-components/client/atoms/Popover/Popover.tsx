import * as RadixPopover from "@radix-ui/react-popover";
import { PopoverContent } from "./PopoverContent";

export const Popover = Object.assign(RadixPopover.Root, {
    Content: PopoverContent,
    Trigger: RadixPopover.Trigger,
});
