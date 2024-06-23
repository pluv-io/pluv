import { createContext } from "react";

export interface PresenceTooltipContextState {
    color: string;
    count: number;
    selectionId: string;
}

export const PresenceTooltipContext = createContext<PresenceTooltipContextState>({
    color: "transparent",
    count: 0,
    selectionId: "",
});
