import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";

export interface PresenceTooltipContextState {
    color: string;
    controlled: boolean;
    count: number;
    selected: boolean;
    selectedId: string | null;
    selectionId: string;
    setSelectedId: Dispatch<SetStateAction<string | null>>;
}

export const PresenceTooltipContext = createContext<PresenceTooltipContextState>({
    color: "transparent",
    controlled: false,
    count: 0,
    selected: false,
    selectedId: null,
    selectionId: "",
    setSelectedId: () => undefined,
});
