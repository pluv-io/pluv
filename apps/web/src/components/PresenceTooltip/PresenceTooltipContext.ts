import { createContext } from "react";

export interface PresenceTooltipContextState {
    [selectionId: string]: number;
}

export const PresenceTooltipContext = createContext<PresenceTooltipContextState>({});
