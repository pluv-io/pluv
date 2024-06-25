"use client";

import { PresenceTooltip as BasePresenceTooltip } from "./PresenceTooltip";
import { PresenceTooltipContent } from "./PresenceTooltipContent";
import { PresenceTooltipProvider } from "./PresenceTooltipProvider";
import { PresenceTooltipTrigger } from "./PresenceTooltipTrigger";

export type { PresenceTooltipProps } from "./PresenceTooltip";
export { PresenceTooltipContent } from "./PresenceTooltipContent";
export type { PresenceTooltipContentProps } from "./PresenceTooltipContent";
export { PresenceTooltipProvider } from "./PresenceTooltipProvider";
export type { PresenceTooltipProviderProps } from "./PresenceTooltipProvider";
export { PresenceTooltipTrigger } from "./PresenceTooltipTrigger";
export type { PresenceTooltipTriggerProps } from "./PresenceTooltipTrigger";

export const PresenceTooltip = Object.assign(BasePresenceTooltip, {
    Content: PresenceTooltipContent,
    Provider: PresenceTooltipProvider,
    Trigger: PresenceTooltipTrigger,
});
