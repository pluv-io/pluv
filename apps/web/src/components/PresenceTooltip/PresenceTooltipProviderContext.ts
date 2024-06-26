import { createContext } from "react";

export interface PresenceTooltipProviderContextState {
    selectedId: string | null;
    selections: { [selectionId: string]: number };
}

export const PresenceTooltipProviderContext = createContext<PresenceTooltipProviderContextState>({
    selectedId: null,
    selections: {},
});
