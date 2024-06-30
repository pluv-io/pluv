export const getContrastRatio = (lum1: number, lum2: number): number => {
    return lum1 > lum2 ? (lum1 + 0.05) / (lum2 + 0.05) : (lum2 + 0.05) / (lum1 + 0.05);
};
