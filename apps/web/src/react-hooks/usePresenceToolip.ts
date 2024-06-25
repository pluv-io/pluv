import { useContext } from "react";
import { PresenceTooltipProviderContext } from "../components/PresenceTooltip/PresenceTooltipProviderContext";

export const usePresenceTooltip = () => {
    const { selectedId, setSelectedId } = useContext(PresenceTooltipProviderContext);

    return [selectedId, setSelectedId] as const;
};
