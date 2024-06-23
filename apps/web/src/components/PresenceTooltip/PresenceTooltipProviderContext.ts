import { createContext } from "react";

export interface PresenceTooltipProviderContextState {
    [selectionId: string]: number;
}

export const PresenceTooltipProviderContext = createContext<PresenceTooltipProviderContextState>({});
