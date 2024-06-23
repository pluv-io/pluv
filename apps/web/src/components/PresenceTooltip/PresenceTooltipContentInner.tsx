import { cn } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef, memo, useContext, useMemo } from "react";
import { useConnection, useMyPresence, useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipContext } from "./PresenceTooltipContext";

const MAX_AVATARS = 3;

export type PresenceTooltipContentInnerProps = RadixTooltip.TooltipContentProps & {
    className?: string;
};

export const PresenceTooltipContentInner = memo(
    forwardRef<ElementRef<typeof RadixTooltip.Content>, PresenceTooltipContentInnerProps>((props, ref) => {
        const { children, className, sideOffset, ...restProps } = props;

        const { color, count, selectionId } = useContext(PresenceTooltipContext);

        const [userSelected] = useMyPresence((presence) => presence.selectionId === selectionId);
        const userConnectionId = useConnection((connection) => connection.id);
        const othersConnectionIds = useOthers((others) => {
            return others
                .filter(({ presence }) => presence.selectionId === selectionId)
                .map(({ connectionId }) => connectionId);
        });

        const connectionIds = useMemo(
            () => [...othersConnectionIds, ...(userSelected ? [userConnectionId] : [])].slice(0, MAX_AVATARS),
            [othersConnectionIds, userConnectionId, userSelected],
        );

        return (
            <RadixTooltip.Content
                ref={ref}
                {...restProps}
                sideOffset={sideOffset}
                className={cn(
                    oneLine`
                        z-50
                        overflow-hidden
                        rounded-md
                        border
                        bg-tooltip
                        px-3
                        py-1.5
                        text-center
                        text-xs
                        text-tooltip-foreground
                        shadow-md
                        animate-in
                        fade-in-0
                        zoom-in-95
                        data-[state=closed]:animate-out
                        data-[state=closed]:fade-out-0
                        data-[state=closed]:zoom-out-95
                        data-[side=bottom]:slide-in-from-top-2
                        data-[side=left]:slide-in-from-right-2
                        data-[side=right]:slide-in-from-left-2
                        data-[side=top]:slide-in-from-bottom-2
                    `,
                    className,
                )}
            />
        );
    }),
);

PresenceTooltipContentInner.displayName = "PresenceTooltipContentInner";
