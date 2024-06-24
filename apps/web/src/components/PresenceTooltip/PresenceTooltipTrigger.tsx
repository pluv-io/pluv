import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { CSSProperties, ReactNode } from "react";
import { memo, useContext } from "react";
import { PresenceTooltipContext } from "./PresenceTooltipContext";
import { useMyPresence } from "../../pluv-io/cloudflare";

export interface PresenceTooltipTriggerProps {
    children?: ReactNode;
}

export const PresenceTooltipTrigger = memo<PresenceTooltipTriggerProps>(({ children }) => {
    const { color, selectionId } = useContext(PresenceTooltipContext);

    const [, setPresence] = useMyPresence(() => true);

    return (
        <RadixTooltip.Trigger
            asChild
            className="ring-4 ring-offset-1"
            onBlur={() => {
                setPresence({ selectionId: null });
            }}
            onFocus={() => {
                setPresence({ selectionId });
            }}
            style={{ "--tw-ring-color": color } as CSSProperties}
        >
            {children}
        </RadixTooltip.Trigger>
    );
});

PresenceTooltipTrigger.displayName = "PresenceTooltipTrigger";
