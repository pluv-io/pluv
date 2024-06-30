import { Avatar } from "@pluv-internal/react-components/client";
import { capitalize, cn } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { oneLine } from "common-tags";
import type { CSSProperties, ElementRef } from "react";
import { forwardRef, memo, useContext, useMemo } from "react";
import { useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipContext } from "./PresenceTooltipContext";

export type PresenceTooltipContentInnerProps = RadixTooltip.TooltipContentProps & {
    className?: string;
};

export const PresenceTooltipContentInner = memo(
    forwardRef<ElementRef<typeof RadixTooltip.Content>, PresenceTooltipContentInnerProps>((props, ref) => {
        const { align = "start", children, className, side = "top", sideOffset = 2, style, ...restProps } = props;

        const { color, count, selected, selectionId } = useContext(PresenceTooltipContext);

        const multiSelected = count + Number(selected) > 1;

        const connectionIds = useOthers((others) => {
            return others
                .filter(({ presence }) => presence.selectionId === selectionId)
                .map(({ connectionId }) => connectionId);
        });

        const connectionId: string | null = connectionIds[0] ?? null;
        const firstOther = useMemo(
            () => (!!count && !!connectionId ? `Anonymous ${capitalize(Avatar.Animal.getAnimal(connectionId))}` : null),
            [connectionId, count],
        );

        return (
            <RadixTooltip.Content
                ref={ref}
                {...restProps}
                align={align}
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
                        bg-card
                        px-2
                        py-0.5
                        text-center
                        text-xs
                        text-white
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
                    multiSelected ? "bg-primary" : "bg-[var(--pluv-selection-bg)]",
                    className,
                )}
                style={{
                    ...(multiSelected || !color ? {} : ({ "--pluv-selection-bg": color } as CSSProperties)),
                    ...style,
                }}
            >
                {selected && !count && "You"}
                {selected && count === 1 && `You and ${firstOther}`}
                {selected && count > 1 && `You and ${count.toLocaleString()} others`}
                {!selected && count === 1 && `${firstOther}`}
                {!selected && count > 1 && `${firstOther} and ${(count - 1).toLocaleString()} others`}
            </RadixTooltip.Content>
        );
    }),
);

PresenceTooltipContentInner.displayName = "PresenceTooltipContentInner";
