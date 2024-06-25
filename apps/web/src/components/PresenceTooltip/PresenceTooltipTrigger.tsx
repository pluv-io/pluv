import { cn } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { oneLine } from "common-tags";
import type { CSSProperties, ReactNode } from "react";
import { memo, useContext, useRef } from "react";
import { PresenceTooltipContext } from "./PresenceTooltipContext";

export interface PresenceTooltipTriggerProps {
    children?: ReactNode;
    className?: string;
}

export const PresenceTooltipTrigger = memo<PresenceTooltipTriggerProps>(({ children, className }) => {
    const { color, controlled, selectedId, selectionId, setSelectedId } = useContext(PresenceTooltipContext);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    return (
        <RadixTooltip.Trigger
            ref={triggerRef}
            asChild
            className={cn(
                oneLine`
                    ring-4
                    ring-offset-1
                    focus-visible:ring-4
                    focus-visible:ring-offset-1
                `,
                className,
            )}
            onBlur={() => {
                if (controlled) return;
                /**
                 * @description If something else was focused to blur this, then don't unfocus that
                 */
                if (typeof selectedId === "string" && selectedId !== selectionId) return;

                setSelectedId(null);
            }}
            onFocus={() => {
                if (controlled) return;

                setSelectedId(selectionId);
            }}
            data-pluv-selection-id={selectionId}
            style={{ "--tw-ring-color": color } as CSSProperties}
        >
            {children}
        </RadixTooltip.Trigger>
    );
});

PresenceTooltipTrigger.displayName = "PresenceTooltipTrigger";
