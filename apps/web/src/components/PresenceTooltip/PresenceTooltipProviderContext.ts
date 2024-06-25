import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";

export interface PresenceTooltipProviderContextState {
    selectedId: string | null;
    selections: { [selectionId: string]: number };
    setSelectedId: Dispatch<SetStateAction<string | null>>;
}

export const PresenceTooltipProviderContext = createContext<PresenceTooltipProviderContextState>({
    selectedId: null,
    selections: {},
    setSelectedId: () => undefined,
});
