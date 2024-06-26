import { createContext } from "react";

export interface PresenceTooltipContextState {
    color: string | null;
    count: number;
    selected: boolean;
    selectedId: string | null;
    selectionId: string;
}

export const PresenceTooltipContext = createContext<PresenceTooltipContextState>({
    color: null,
    count: 0,
    selected: false,
    selectedId: null,
    selectionId: "",
});
