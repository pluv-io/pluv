import { getLuminance } from "./getLuminance";
import { hexToRgb } from "./hexToRgb";

export const getMaxContrast = (colors: string[]): [minColor: string, maxColor: string] => {
    if (colors.length < 1) throw new Error("At least one color is required.");

    const luminances = colors.map((color) => ({
        color,
        luminance: getLuminance(...hexToRgb(color)),
    }));

    const { minColor, maxColor } = luminances.reduce(
        (acc, { color, luminance }) => {
            if (luminance < acc.minLuminance) {
                acc.minLuminance = luminance;
                acc.minColor = color;
            }

            if (luminance > acc.maxLuminance) {
                acc.maxLuminance = luminance;
                acc.maxColor = color;
            }

            return acc;
        },
        {
            minLuminance: Number.POSITIVE_INFINITY,
            maxLuminance: Number.NEGATIVE_INFINITY,
            minColor: "",
            maxColor: "",
        },
    );

    return [minColor, maxColor];
};
