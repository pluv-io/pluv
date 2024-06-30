import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ElementRef } from "react";
import { forwardRef, memo, useContext } from "react";
import { PresenceTooltipContentInner } from "./PresenceTooltipContentInner";
import { PresenceTooltipContext } from "./PresenceTooltipContext";

export type PresenceTooltipContentProps = RadixTooltip.TooltipContentProps & {
    className?: string;
};

export const PresenceTooltipContent = memo(
    forwardRef<ElementRef<typeof RadixTooltip.Content>, PresenceTooltipContentProps>((props, ref) => {
        const { count } = useContext(PresenceTooltipContext);

        if (!count) return null;

        return <PresenceTooltipContentInner {...props} ref={ref} />;
    }),
);

PresenceTooltipContent.displayName = "PresenceTooltipContent";
