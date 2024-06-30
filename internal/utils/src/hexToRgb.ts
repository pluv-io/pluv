export const hexToRgb = (hex: string): [number, number, number] => {
    if (hex.length === 4) {
        const r = parseInt(hex.slice(1, 2).repeat(2), 16);
        const g = parseInt(hex.slice(2, 3).repeat(2), 16);
        const b = parseInt(hex.slice(3).repeat(2), 16);

        return [r, g, b];
    }

    if (hex.length === 7) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return [r, g, b];
    }

    throw new Error("Invalid HEX color.");
};
