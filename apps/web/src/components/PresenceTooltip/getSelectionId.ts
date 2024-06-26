import { DATA_ATTR_SELECTION_ID } from "./constants";

export const getSelectionId = (element: Element | null): string | null => {
    if (!element) return null;

    const selectionId = element.getAttribute(DATA_ATTR_SELECTION_ID);

    return typeof selectionId === "string" ? selectionId : getSelectionId(element.parentElement);
};
