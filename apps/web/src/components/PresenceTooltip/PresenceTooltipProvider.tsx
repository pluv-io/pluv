import * as RadixTooltip from "@radix-ui/react-tooltip";
import { useMemo, type FC, type ReactNode } from "react";
import { useMyPresence, useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipProviderContext } from "./PresenceTooltipProviderContext";

export interface PresenceTooltipProviderProps {
    children?: ReactNode;
    delayDuration?: number;
    disableHoverableContent?: boolean;
    skipDelayDuration?: number;
}

export const PresenceTooltipProvider: FC<PresenceTooltipProviderProps> = ({
    children,
    delayDuration = 150,
    disableHoverableContent,
    skipDelayDuration,
}) => {
    const selections = useOthers((others) => {
        console.log("others", others);

        return others.reduce<{ [selectionId: string]: number }>((map, other) => {
            const selectionId = other.presence.selectionId;

            if (typeof selectionId !== "string") return map;

            const prevCount = map[selectionId] ?? 0;

            /**
             * !HACK
             * @description Use mutable state for performance's sake
             * @date June 22, 2024
             */
            map[selectionId] = prevCount + 1;

            return map;
        }, {});
    });

    return (
        <PresenceTooltipProviderContext.Provider value={selections}>
            <RadixTooltip.Provider
                delayDuration={delayDuration}
                disableHoverableContent={disableHoverableContent}
                skipDelayDuration={skipDelayDuration}
            >
                {children}
            </RadixTooltip.Provider>
        </PresenceTooltipProviderContext.Provider>
    );
};
