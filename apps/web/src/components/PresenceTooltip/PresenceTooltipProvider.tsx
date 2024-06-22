import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { FC, ReactNode } from "react";
import { useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipContext } from "./PresenceTooltipContext";

export interface PresenceTooltipProviderProps {
    children?: ReactNode;
    delayDuration?: number;
    disableHoverableContent?: boolean;
    skipDelayDuration?: number;
}

export const PresenceTooltipProvider: FC<PresenceTooltipProviderProps> = ({
    children,
    delayDuration,
    disableHoverableContent,
    skipDelayDuration,
}) => {
    const selections = useOthers((others) => {
        return others.reduce<{ [selectionId: string]: number }>((map, other) => {
            const selectionId = other.presence.selectionId;

            if (typeof selectionId !== "string") return map;

            const prevCount = map[selectionId] ?? 0;

            /**
             * !HACK
             * @description Use mutable state for performance's sake
             * @date June 22, 2024
             */
            map[selectionId] = prevCount;

            return map;
        }, {});
    });

    return (
        <PresenceTooltipContext.Provider value={selections}>
            <RadixTooltip.Provider
                delayDuration={delayDuration}
                disableHoverableContent={disableHoverableContent}
                skipDelayDuration={skipDelayDuration}
            >
                {children}
            </RadixTooltip.Provider>
        </PresenceTooltipContext.Provider>
    );
};
