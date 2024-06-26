import { useMemo } from "react";
import { DATA_ATTR_SELECTION_ID } from "../components/PresenceTooltip/constants";

export interface UsePresenceTooltipParams {
    selectionId: string;
}

export const usePresenceTooltip = (params: UsePresenceTooltipParams) => {
    const { selectionId } = params;

    const attributes = useMemo(() => ({ [DATA_ATTR_SELECTION_ID]: selectionId }), [selectionId]);

    return { attributes };
};
