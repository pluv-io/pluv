import { cn } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { oneLine } from "common-tags";
import type { CSSProperties, ReactNode } from "react";
import { memo, useContext, useMemo, useRef } from "react";
import { PresenceTooltipContext } from "./PresenceTooltipContext";
import { DATA_ATTR_SELECTION_ID } from "./constants";
import { useOthers } from "../../pluv-io/cloudflare";

export interface PresenceTooltipTriggerProps {
    children?: ReactNode;
    className?: string;
}

export const PresenceTooltipTrigger = memo<PresenceTooltipTriggerProps>(({ children, className }) => {
    const { color, count, selected, selectionId } = useContext(PresenceTooltipContext);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const attributes = useMemo(() => ({ [DATA_ATTR_SELECTION_ID]: selectionId }), [selectionId]);

    const multiSelected = count + Number(selected) > 1;

    return (
        <RadixTooltip.Trigger
            asChild
            {...attributes}
            ref={triggerRef}
            className={cn(
                oneLine`
                    ring-4
                    ring-transparent
                    ring-offset-1
                    focus-visible:ring-4
                    focus-visible:ring-offset-1
                `,
                multiSelected && "ring-primary",
                className,
            )}
            style={multiSelected || !color ? {} : ({ "--tw-ring-color": color } as CSSProperties)}
        >
            {children}
        </RadixTooltip.Trigger>
    );
});

PresenceTooltipTrigger.displayName = "PresenceTooltipTrigger";
