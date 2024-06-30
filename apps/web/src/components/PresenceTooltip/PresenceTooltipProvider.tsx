import { debounce } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { FC, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMyPresence, useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipProviderContext } from "./PresenceTooltipProviderContext";
import { getSelectionId } from "./getSelectionId";

const DEFAULT_DEBOUNCE_MS = 50;

export interface PresenceTooltipProviderProps {
    children?: ReactNode;
    debounce?: number;
    delayDuration?: number;
    disableHoverableContent?: boolean;
    skipDelayDuration?: number;
}

export const PresenceTooltipProvider: FC<PresenceTooltipProviderProps> = ({
    children,
    debounce: debounceMs = DEFAULT_DEBOUNCE_MS,
    disableHoverableContent,
    skipDelayDuration,
}) => {
    /**
     * !HACK
     * @description Track selectedId in react state instead of presence so that user's own perceived
     * presence doesn't get debounced.
     * @date June 25, 2024
     */
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [, setPresence] = useMyPresence(() => true);

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
            map[selectionId] = prevCount + 1;

            return map;
        }, {});
    });

    const updateSelectionId = useMemo(() => {
        return debounce(
            (selectionId: string | null) => {
                setPresence({ selectionId });
            },
            { wait: debounceMs },
        );
    }, [debounceMs, setPresence]);

    const state = useMemo(() => ({ selectedId, selections }), [selectedId, selections]);

    useEffect(() => {
        const handleFocusIn = () => {
            const selectionId = getSelectionId(document.activeElement);

            setSelectedId(selectionId);
            updateSelectionId(selectionId);
        };

        const handleFocusOut = () => {
            setTimeout(() => {
                const selectionId = getSelectionId(document.activeElement);

                setSelectedId(selectionId);
                updateSelectionId(selectionId);
            }, 0);
        };

        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("focusout", handleFocusOut);

        return () => {
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("focusout", handleFocusOut);
        };
    }, [updateSelectionId]);

    return (
        <PresenceTooltipProviderContext.Provider value={state}>
            <RadixTooltip.Provider
                disableHoverableContent={disableHoverableContent}
                skipDelayDuration={skipDelayDuration}
            >
                {children}
            </RadixTooltip.Provider>
        </PresenceTooltipProviderContext.Provider>
    );
};
