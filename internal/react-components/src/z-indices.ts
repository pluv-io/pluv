const zIndices = [
    "default",
    "extra",
    "footer",
    "app-bar",
    "backdrop",
    "side-drawer",
] as const;

export type ZIndexElement = (typeof zIndices)[number];

export const getZIndex = (element: ZIndexElement): number => {
    return zIndices.indexOf(element) * 10;
};
