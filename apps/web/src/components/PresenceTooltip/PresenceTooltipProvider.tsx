import { debounce } from "@pluv-internal/utils";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { Dispatch, FC, ReactNode, SetStateAction } from "react";
import { useMemo } from "react";
import { useMyPresence, useOthers } from "../../pluv-io/cloudflare";
import { PresenceTooltipProviderContext } from "./PresenceTooltipProviderContext";

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
    const [selectedId, setPresence] = useMyPresence((presence) => presence.selectionId);

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

    const setSelectedId = useMemo((): Dispatch<SetStateAction<string | null>> => {
        return debounce(
            (newSelectedId: SetStateAction<string | null>) => {
                setPresence((prevPresence) => ({
                    selectionId:
                        typeof newSelectedId === "function"
                            ? newSelectedId(prevPresence?.selectionId ?? null)
                            : newSelectedId,
                }));
            },
            { wait: debounceMs },
        );
    }, [debounceMs, setPresence]);

    const state = useMemo(() => ({ selectedId, selections, setSelectedId }), [selectedId, selections, setSelectedId]);

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
