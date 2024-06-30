import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { Tooltip as BaseTooltip } from "./Tooltip";
import { TooltipContent } from "./TooltipContent";
import { TooltipProvider } from "./TooltipProvider";

export * from "./TooltipContent";
export * from "./TooltipProvider";
export * from "./TooltipTrigger";

export const Tooltip = Object.assign(BaseTooltip, {
    Content: TooltipContent,
    Provider: TooltipProvider,
    Trigger: TooltipTrigger,
});
