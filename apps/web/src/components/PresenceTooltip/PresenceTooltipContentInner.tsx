import { Avatar } from "@pluv-internal/react-components/client";
import { cn } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef, memo, useContext } from "react";
import { useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipContext } from "./PresenceTooltipContext";

const MAX_AVATARS = 3;
const OPACITY = 45;

const getHexOpacity = (opacity: number): string => {
    const clamped = Math.min(Math.max(Math.floor((opacity * 255) / 100), 0), 255);

    return clamped.toString(16);
};

export type PresenceTooltipContentInnerProps = RadixTooltip.TooltipContentProps & {
    className?: string;
};

export const PresenceTooltipContentInner = memo(
    forwardRef<ElementRef<typeof RadixTooltip.Content>, PresenceTooltipContentInnerProps>((props, ref) => {
        const { children, className, side = "right", sideOffset = 6, style, ...restProps } = props;

        const { color, count, selectionId } = useContext(PresenceTooltipContext);

        const connectionIds = useOthers((others) => {
            return others
                .filter(({ presence }) => presence.selectionId === selectionId)
                .map(({ connectionId }) => connectionId)
                .slice(0, MAX_AVATARS);
        });

        const plusOthers = Math.max(count - connectionIds.length, 0);

        return (
            <RadixTooltip.Content
                ref={ref}
                {...restProps}
                side={side}
                sideOffset={sideOffset}
                className={cn(
                    oneLine`
                        z-50
                        inline-flex
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-md
                        border-2
                        bg-card
                        px-2
                        py-0.5
                        text-center
                        text-xs
                        text-card-foreground
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
                style={{
                    borderColor: `${color}${getHexOpacity(OPACITY)}`,
                    ...style,
                }}
            >
                <Avatar.Group>
                    {connectionIds.map((connectionId) => (
                        <Avatar key={connectionId} className="size-8">
                            <Avatar.Animal className="size-8" data={connectionId} height={32} width={32} />
                        </Avatar>
                    ))}
                    {!!plusOthers && <Avatar.Count className="size-8" count={plusOthers} />}
                </Avatar.Group>
            </RadixTooltip.Content>
        );
    }),
);

PresenceTooltipContentInner.displayName = "PresenceTooltipContentInner";
